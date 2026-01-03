// Example API service for drivers app
// You can expand this with real endpoints later

export async function loginDriver(email, password) {
  // Replace with real API call
  return { success: true, token: "demo-token" };
}

export async function fetchAssignedJobs(token) {
  // Replace with real API call
  return [
    { id: 1, title: "Pickup at Oxford St.", status: "pending" },
    { id: 2, title: "Deliver to Airport Area", status: "in-progress" },
  ];
}

export async function fetchJobDetails(jobId, token) {
  // Replace with real API call
  return { id: jobId, title: "Pickup at Oxford St.", details: "Box 3, 10:00am" };
}
