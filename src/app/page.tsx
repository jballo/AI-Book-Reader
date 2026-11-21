"use server";

import { auth } from "@clerk/nextjs/server";
import Dashboard from "@/components/custom/Dashboard";
import Landing from "@/components/custom/Landing";
import { DeletePdf, ListPdfs, UploadPdfMetadata } from "./actions/files";
import { convertTextToSpeech } from "./actions/audio";

export default async function Home() {
  const { userId } = await auth();
  if (!userId) return <Landing />;

  return <Dashboard uploadPdfMetadata={UploadPdfMetadata} listPdfs={ListPdfs} convertTextToSpeech={convertTextToSpeech} deletePdf={DeletePdf}/>;
}
