// Simple debug test to check GitHub service behavior
import { GitHubService } from './apps/cli/src/services/reporting/integrations/github-service.js';

// Create a simple mock for fetch
const mockFetch = async (url, options) => {
  console.log('Mock fetch called with:', url, options?.method);

  if (url.includes('/issues')) {
    return {
      ok: false,
      status: 400,
      text: async () => 'API rate limit exceeded'
    };
  }

  return {
    ok: false,
    status: 404,
    text: async () => 'Not found'
  };
};

// Replace global fetch
global.fetch = mockFetch;

async function testGitHubService() {
  console.log('Testing GitHub service...');

  const service = new GitHubService({
    token: 'ghp_test',
    owner: 'test-owner',
    repo: 'test-repo'
  });

  try {
    const result = await service.createQualityIssues([{
      title: 'Test Issue',
      description: 'Test description',
      severity: 'error'
    }]);

    console.log('Result:', result);
  } catch (error) {
    console.log('Caught error:', error);
  }
}

testGitHubService().catch(console.error);