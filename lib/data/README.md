# Data Layer Architecture

This directory contains the data access layer for the Impact Training application.

## Architecture Overview

The data layer is designed with a repository pattern that separates business logic from data storage implementation. This allows us to:

1. **Swap storage implementations** without changing business logic
2. **Test business logic** with mock repositories
3. **Maintain clean separation** between UI and data access
4. **Support multiple storage backends** (LocalStorage, API, Database)

## Current Implementation

- **Repository Interfaces**: Define contracts for data access operations
- **In-Memory Repository Layer**: Temporary implementation using a shared in-memory state during development
- **Future**: Will be replaced with API/database implementation

## Repository Structure

Each repository follows this pattern:
1. **Interface** in `types/` - Defines the contract
2. **Implementation** in `repositories/` - Concrete implementation
3. **Storage Adapter** in `storage/` - Low-level storage operations

## Migration Path

When migrating to a real backend:

1. Replace LocalStorage adapter with API client
2. Update repository implementations to use API calls
3. UI code remains unchanged (uses repository interfaces)

## Important Notes

- **Security**: Passwords are never stored in plain text
- **Type Safety**: All operations use TypeScript types from `types/`
- **Error Handling**: Repositories should throw standardized errors
- **Validation**: Business logic validation should happen before repository calls
