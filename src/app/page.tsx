"use server";

import Dashboard from "@/components/custom/Dashboard";
import { createUser, userExists } from "./actions/users";

export default async function Home() {
  return <Dashboard createUser={createUser} userExists={userExists}/>;
}
