// Function to validate that there is a session started and thus protect the routes defined below

export { default } from "next-auth/middleware"

export const config = { matcher: ["/dashboard"] }