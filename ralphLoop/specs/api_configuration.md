# API Configuration

## Summary

The agent reads its Anthropic API credentials and model selection from the environment before starting work.

## Context

The agent cannot communicate with the Anthropic API without valid credentials. Configuration must be resolved before the agent loop begins, and failures must be reported clearly so the user can fix their setup. Keeping configuration as a separate concern from the loop itself means the loop can assume a working API client.

## Acceptance Criteria

- The agent reads the API key from the ANTHROPIC_API_KEY environment variable.
- If the environment variable is not set or is empty, the agent prints a clear error message and exits before attempting any API call.
- The agent uses a default model when none is specified.
- The agent allows the user to override the model via a ANTHROPIC_MODEL environment variable.
- The agent validates that it can authenticate with the API before entering the main loop; if authentication fails, it reports the error and exits.

## Edge Cases

- The API key is set but is malformed or revoked — the agent reports the authentication error returned by the API.
- The user specifies a model name that does not exist — the agent reports the error returned by the API.
- Multiple configuration sources conflict — environment variables are the single source of truth.

## Out of Scope

- Configuration files, CLI flags for credentials, or interactive prompts for the API key.
- Key rotation or refresh during a session.
- Support for non-Anthropic API providers or endpoints.
