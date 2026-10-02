import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🏠 StaySphere AI</h1>
        <p className="text-muted-foreground mb-8">
          AI-Powered Vacation Rental Marketplace
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Count is {count}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Edit <code className="px-2 py-1 bg-muted rounded">src/App.tsx</code> to get started
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
