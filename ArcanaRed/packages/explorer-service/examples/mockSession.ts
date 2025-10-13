import { ExplorerService, MockComputerUseClient } from '../src';

async function main() {
  const mockClient = new MockComputerUseClient([
    {
      type: 'action',
      timestamp: new Date().toISOString(),
      state: 'login_form',
      selector: '#username',
      action: 'type',
      params: { value: 'alice@example.com' }
    },
    {
      type: 'dom_snapshot',
      timestamp: new Date().toISOString(),
      html: '<html><body><input id="username" value="***" /></body></html>'
    },
    {
      type: 'network_har',
      timestamp: new Date().toISOString(),
      path: '/tmp/run-123/network.har'
    },
    {
      type: 'artifact',
      timestamp: new Date().toISOString(),
      artifactType: 'screenshot',
      path: '/tmp/run-123/screenshot.png',
      contentType: 'image/png',
      description: 'Mock screenshot'
    }
  ]);

  const explorer = new ExplorerService(
    {
      workflow: 'zelle_send',
      goal: 'Send $5 to Test Recipient',
      redactionRules: [
        { name: 'email', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '***@***' }
      ]
    },
    mockClient
  );

  const result = await explorer.run();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
