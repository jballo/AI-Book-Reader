"use server";

import Dashboard from "@/components/custom/Dashboard";
import { UploadPdf, UploadPdfMetadata } from "./actions/files";
import { convertTextToSpeech } from "./actions/audio";

export default async function Home() {
  return <Dashboard uploadPdf={UploadPdf} uploadPdfMetadata={UploadPdfMetadata} convertTextToSpeech={convertTextToSpeech}/>;
}
