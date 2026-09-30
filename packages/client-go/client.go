package flagslocal

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

type FlagRule struct {
	Attribute string      `json:"attribute"`
	Operator  string      `json:"operator"`
	Value     interface{} `json:"value"`
}

type FeatureFlag struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	Enabled      bool            `json:"enabled"`
	Percentage   *int            `json:"percentage,omitempty"`
	Environments map[string]bool `json:"environments"`
	Rules        []FlagRule      `json:"rules,omitempty"`
	Value        interface{}     `json:"value,omitempty"`
}

type Client struct {
	baseURL     string
	environment string
	flags       map[string]FeatureFlag
	mu          sync.RWMutex
	httpClient  *http.Client
}

func NewClient(baseURL string, environment string) *Client {
	if environment == "" {
		environment = "development"
	}
	return &Client{
		baseURL:     strings.TrimRight(baseURL, "/"),
		environment: environment,
		flags:       make(map[string]FeatureFlag),
		httpClient:  &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *Client) FetchFlags() error {
	resp, err := c.httpClient.Get(fmt.Sprintf("%s/api/v1/flags", c.baseURL))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var list []FeatureFlag
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return err
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	for _, f := range list {
		c.flags[f.ID] = f
	}
	return nil
}

func (c *Client) IsEnabled(flagID string, userKey string) bool {
	c.mu.RLock()
	flag, exists := c.flags[flagID]
	c.mu.RUnlock()

	if !exists {
		return false
	}

	envEnabled, ok := flag.Environments[c.environment]
	if !ok {
		envEnabled = flag.Enabled
	}
	if !envEnabled {
		return false
	}

	if flag.Percentage != nil {
		if *flag.Percentage <= 0 {
			return false
		}
		if *flag.Percentage >= 100 {
			return true
		}
		h := sha256.Sum256([]byte(fmt.Sprintf("%s:%s", flagID, userKey)))
		val := binary.BigEndian.Uint32(h[:4])
		return int(val%100) < *flag.Percentage
	}

	return true
}
