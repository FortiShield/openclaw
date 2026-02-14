# Contributing to CLAWDIS Dashboard

Thank you for your interest in contributing to the CLAWDIS Dashboard! This document provides guidelines for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 10.23.0
- Git
- Basic knowledge of TypeScript, React, and Next.js

### Setting Up Development Environment

```bash
# 1. Clone repository
git clone https://github.com/FortiShield/openclaw.git
cd openclaw

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Configure environment
# Edit .env.local with your local gateway URL
NEXT_PUBLIC_GATEWAY_BASE_URL=http://localhost:3001
NEXT_PUBLIC_GATEWAY_WS_URL=ws://localhost:3001

# 5. Start development server
pnpm dev

# 6. Open browser
# http://localhost:3000
```

## Development Workflow

### Branch Naming

```
feat/feature-name        - New feature
fix/bug-description      - Bug fix
docs/documentation-name  - Documentation
perf/improvement-name    - Performance improvement
refactor/description     - Code refactoring
test/test-name          - Tests
chore/maintenance       - Maintenance tasks
```

### Commit Messages

Follow the conventional commits format:

```
type(scope): subject

body

footer
```

Examples:
```
feat(dashboard): add real-time health monitoring

- Implement WebSocket event handling
- Add health status widget
- Update metrics collection

Closes #123
```

```
fix(websocket): handle connection timeout

Previously, the WebSocket would hang on slow connections.
Now it properly times out after 30 seconds.
```

### Pull Request Process

1. **Create feature branch**
```bash
git checkout -b feat/your-feature
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat(component): describe changes"
```

3. **Push to remote**
```bash
git push origin feat/your-feature
```

4. **Create Pull Request**
   - Title: Concise description of changes
   - Description: Explain why and how
   - Link related issues

5. **Address review comments**
```bash
# Make requested changes
git add .
git commit -m "refactor: address review comments"
git push
```

6. **Merge when approved**

## Code Standards

### TypeScript

- Use strict mode (already enabled)
- Avoid `any` types - use proper typing
- Use type inference where appropriate
- Add JSDoc comments for public APIs

```typescript
/**
 * Fetches user data from the gateway
 * @param userId - The user ID to fetch
 * @returns Promise of user data
 * @throws ApiError if request fails
 */
export async function getUserData(userId: string): Promise<User> {
  const response = await apiGet<User>(`/users/${userId}`);
  return response;
}
```

### React Components

```typescript
// Use function components with hooks
export function MyComponent({ prop1, prop2 }: Props) {
  const [state, setState] = useState<StateType>(initialValue);

  const handleChange = useCallback((value: string) => {
    setState(value);
  }, []);

  return <div onClick={handleChange}>{state}</div>;
}
```

#### Component Organization

```typescript
// 1. Imports
import { useCallback, useState } from "react";

// 2. Type definitions
interface Props {
  items: Item[];
  onSelect: (item: Item) => void;
}

interface Item {
  id: string;
  label: string;
}

// 3. Component
export function ItemList({ items, onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = useCallback(
    (item: Item) => {
      setSelected(item.id);
      onSelect(item);
    },
    [onSelect]
  );

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} onClick={() => handleSelect(item)}>
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

### Styling

- Use TailwindCSS classes
- Keep custom CSS minimal
- Use CSS variables for theme colors
- Follow responsive design (mobile-first)

```typescript
export function Card() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Title</h2>
      <p className="mt-2 text-sm text-muted-foreground">Description</p>
    </div>
  );
}
```

### API Integration

- Use the `apiGet/Post/Put/Delete` functions from `lib/api.ts`
- Always handle errors properly
- Use type-safe requests

```typescript
import { apiGet, ApiError } from "@/lib/api";

async function fetchData() {
  try {
    const data = await apiGet<DataType>("/endpoint");
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Error: ${error.code} - ${error.message}`);
    }
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test -- connection-status.test.tsx

# Generate coverage report
pnpm test:coverage
```

### Writing Tests

- Write tests for new features
- Aim for >80% code coverage
- Use descriptive test names
- Mock external dependencies

```typescript
import { render, screen } from "@/lib/test-utils";
import { MyComponent } from "@/components/my-component";

describe("MyComponent", () => {
  it("renders title correctly", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("calls onChange when value changes", () => {
    const onChange = jest.fn();
    render(<MyComponent onChange={onChange} />);
    
    // Simulate user interaction
    screen.getByRole("button").click();
    
    expect(onChange).toHaveBeenCalled();
  });
});
```

## Linting and Formatting

```bash
# Check code style
pnpm lint

# Fix code style issues
pnpm lint:fix

# Format code
pnpm format

# Format and fix
pnpm format:fix
```

## Documentation

### Adding Documentation

- Add JSDoc comments for functions/components
- Update README if adding new features
- Add/update docs in `/docs` directory
- Include examples for complex features

```typescript
/**
 * Gateway provider component that manages WebSocket connection
 * 
 * @example
 * ```tsx
 * export default function App() {
 *   return (
 *     <GatewayProvider>
 *       <Dashboard />
 *     </GatewayProvider>
 *   );
 * }
 * ```
 */
export function GatewayProvider({ children }: Props) {
  // ...
}
```

### Documentation Files

- `NEXTJS_GUIDE.md` - Next.js setup and architecture
- `ARCHITECTURE.md` - System architecture
- `PERFORMANCE.md` - Performance optimization
- `DEPLOYMENT.md` - Deployment guide
- `CONTRIBUTING.md` - Contribution guidelines

## Performance Considerations

- Memoize expensive components
- Use `useCallback` for event handlers
- Implement code splitting for large features
- Monitor bundle size

```typescript
import { memo, useCallback } from "react";

export const MemoizedComponent = memo(function Component({ data }: Props) {
  const handleClick = useCallback(() => {
    // handle click
  }, []);

  return <div onClick={handleClick}>{data}</div>;
});
```

## Security

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate user input
- Sanitize output
- Follow OWASP guidelines

```typescript
// Good: Use environment variables
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

// Bad: Hardcode secrets
const apiKey = "secret-key-12345";
```

## Accessibility

- Add alt text to images
- Use semantic HTML
- Ensure color contrast (WCAG AA)
- Support keyboard navigation
- Add ARIA labels where needed

```typescript
export function Button({ label, onClick }: Props) {
  return (
    <button
      className="px-4 py-2 bg-primary text-primary-foreground rounded"
      onClick={onClick}
      aria-label={label}
    >
      {label}
    </button>
  );
}
```

## Common Issues

### WebSocket Connection Fails
- Check GATEWAY_WS_URL is correct
- Verify firewall isn't blocking WebSocket
- Check browser console for errors

### Tests Fail
- Run `pnpm install` to ensure dependencies
- Clear node_modules and reinstall
- Check Node.js version (needs >= 22)

### Build Fails
- Check for TypeScript errors: `pnpm build`
- Clear `.next` directory
- Verify all imports are correct

## Getting Help

- Check existing issues on GitHub
- Review documentation in `/docs`
- Ask in community discussions
- Open an issue if stuck

## Review Process

### What We Look For

✅ Code follows style guidelines
✅ Tests are included and passing
✅ Documentation is updated
✅ No breaking changes (unless necessary)
✅ Commits are well-structured
✅ PR description is clear

### What Might Delay Approval

❌ Missing tests
❌ Inconsistent code style
❌ Poor performance implications
❌ Security concerns
❌ No documentation
❌ Large unrelated changes

## Becoming a Maintainer

Long-term contributors who have demonstrated:
- Consistent quality contributions
- Good understanding of codebase
- Active community engagement
- Willingness to help others

...are eligible for maintainer status.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CLAWDIS! 🎉
