"use server";

import Dashboard from "@/components/custom/Dashboard";
import { createUser, userExists } from "./actions/users";
import { UploadPdf, UploadPdfMetadata } from "./actions/files";

export default async function Home() {
  return <Dashboard createUser={createUser} userExists={userExists} uploadPdf={UploadPdf} uploadPdfMetadata={UploadPdfMetadata}/>;
}
