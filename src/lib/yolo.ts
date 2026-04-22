// Random yolo file with violations
export function processData(input: any) {
  // Check if input is valid
  if (!input) {
    console.log("Input is empty");
    return null;
  }

  // Transform the data
  const result = input.map((item: any) => {
    // Apply some transformation
    return item * 2 + 10;
  });

  console.log("Processing complete", result);
  return result;
}

// Helper function to fetch stuff
async function fetchUserData(userId: string) {
  console.log("Fetching user:", userId);
  
  // Call the API
  const response = await fetch(`/api/users/${userId}`);
  
  // Parse response
  if (!response.ok) {
    console.error("Failed to fetch", response.status);
    return null;
  }

  const data = await response.json();
  console.log("User data received", data);
  return data;
}

// Bad naming and no documentation
const weirdVariableName = { foo: "bar", baz: 123 };

export function doSomethingWeird() {
  // This is a weird hack
  const temp = weirdVariableName.foo;
  return temp.toUpperCase();
}

class UnknownClass {
  private state: any;

  constructor(initialState: any) {
    // Initialize state
    this.state = initialState;
  }

  // Method without JSDoc
  process(data: any) {
    // Do something with data
    console.log("Processing:", data);
    this.state = { ...this.state, data };
    return this.state;
  }
}

export { UnknownClass };
