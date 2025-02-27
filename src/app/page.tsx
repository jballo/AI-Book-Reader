"use server";

import Dashboard from "@/components/custom/Dashboard";
import { createUser, userExists } from "./actions/users";
import { UploadPdf, UploadPdfMetadata } from "./actions/files";
import { convertTextToSpeech } from "./actions/audio";

export default async function Home() {
  return <Dashboard createUser={createUser} userExists={userExists} uploadPdf={UploadPdf} uploadPdfMetadata={UploadPdfMetadata} convertTextToSpeech={convertTextToSpeech}/>;
}
