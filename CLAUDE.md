# CLAUDE.md - Project Guidelines

## Code Style Guidelines
- **Structure**: Follow ES6 module pattern with clear imports/exports
- **Formatting**: 2-space indentation, single quotes for strings
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Imports**: Group by: 1) external libs 2) project modules 3) data/utils
- **Colors**: Use hex values from rainbow palette (#FF0000, #FFA500, etc.)
- **Error Handling**: Use try/catch blocks for Three.js operations
- **Types**: Add JSDoc comments for function parameters and returns
- **File Organization**: Follow folder structure in README.md
- **Performance**: Implement object culling, minimize draw calls
- **Geometry**: Use only built-in Three.js shapes (no external models)

## Coding Instructions
Write secure, maintainable, and efficient code following these principles:

### Core Standards
- Write minimal, self-documenting code
- Use clear naming: verbs for functions, nouns for variables
- Follow SOLID principles and appropriate design patterns
- Implement proper error handling with meaningful messages
- Structure code in logical, maintainable blocks

### Optimization Principles
- Minimize unnecessary computations and memory allocations
- Manage state efficiently to prevent cascading updates
- Consider reference stability for objects and functions
- Cache expensive computations appropriately
- Structure components/modules to isolate changes

### Best Practices
- Plan before implementation
- Validate inputs and handle edge cases
- Add essential documentation only when needed
- Split complex solutions into logical sections


## Useful file
README.md: Complete project description
PLAN.md: Current plan with where we are right now in term of execution - You will have to maintain / edit / change this file to keep track of what needs to be done.