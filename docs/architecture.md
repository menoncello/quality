# DevQuality CLI Fullstack Architecture Document

**This document has been sharded into manageable sections for easier navigation and maintenance.**

## Sharded Document Structure

The complete architecture documentation is now organized in the `docs/architecture/` folder with the following sections:

### Foundation and Overview

- [Introduction](./architecture/introduction.md) - Project introduction, starter template info, and change log
- [High Level Architecture](./architecture/high-level-architecture.md) - Technical summary, platform choices, and architectural patterns
- [Tech Stack](./architecture/tech-stack.md) - Technology stack table and selection rationale
- [Data Models](./architecture/data-models.md) - Database models, interfaces, and relationships

### Technical Specifications

- [API Specification](./architecture/api-specification.md) - CLI commands, plugin interfaces, and event system
- [Components](./architecture/components.md) - Core component architecture and responsibilities
- [External APIs](./architecture/external-apis.md) - External service integrations and APIs
- [Core Workflows](./architecture/core-workflows.md) - Setup wizard, analysis, and plugin development workflows

### Architecture Details

- [Database Schema](./architecture/database-schema.md) - SQLite schema, data access layer, and repositories
- [Frontend Architecture](./architecture/frontend-architecture.md) - CLI component architecture and state management
- [Backend Architecture](./architecture/backend-architecture.md) - Service architecture and database design
- [Unified Project Structure](./architecture/unified-project-structure.md) - Monorepo structure and component organization
- [Source Tree](./architecture/source-tree.md) - Complete file structure and organization

### Development and Deployment

- [Development Workflow](./architecture/development-workflow.md) - Local development setup and environment configuration
- [Deployment Architecture](./architecture/deployment-architecture.md) - Deployment strategy, CI/CD pipeline, and environments
- [Security and Performance](./architecture/security-and-performance.md) - Security requirements, performance targets, and optimization
- [Testing Strategy](./architecture/testing-strategy.md) - Testing pyramid, organization, and examples

### Quality and Standards

- [Coding Standards](./architecture/coding-standards.md) - Fullstack rules, naming conventions, and best practices
- [Error Handling Strategy](./architecture/error-handling-strategy.md) - Error flows, handling patterns, and recovery
- [Monitoring and Observability](./architecture/monitoring-and-observability.md) - Monitoring stack, metrics, and observability
- [Checklist Results Report](./architecture/checklist-results-report.md) - Architecture validation and readiness assessment

## Quick Navigation

For the complete table of contents with detailed subsection links, see [Architecture Index](./architecture/index.md).

## Key Reference Files

The following files are frequently referenced by the development team:

- [Tech Stack](./architecture/tech-stack.md) - Technology choices and rationale
- [Coding Standards](./architecture/coding-standards.md) - Development standards and conventions
- [Source Tree](./architecture/source-tree.md) - Complete project file structure

## Why This Structure?

- **Maintainability**: Each architectural section can be updated independently
- **Readability**: Smaller, focused files are easier to navigate and reference
- **Collaboration**: Team members can work on different architectural aspects simultaneously
- **Performance**: Faster loading and editing of individual sections
- **Modularity**: Clear separation of concerns across different architectural domains

---

_Last Updated: 2025-09-28_
_Version: v4_
_Status: Sharded for improved maintainability_
