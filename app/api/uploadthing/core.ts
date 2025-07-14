import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth"; // Assuming your auth setup is in @/auth

const f = createUploadthing();

// Function to handle authentication for your upload routes
const handleAuth = async () => {
  const session = await auth();
  if (!session?.user?.id) throw new UploadThingError("Unauthorized");
  // Whatever is returned here is accessible in onUploadComplete as `metadata`
  return { userId: session.user.id };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // A general purpose document uploader that accepts many file types
  documentUploader: f({
    // Use a combination of specific types and a general blob for wide compatibility
    image: { maxFileSize: "4MB", maxFileCount: 3 },
    pdf: { maxFileSize: "4MB", maxFileCount: 3 },
    text: { maxFileSize: "4MB", maxFileCount: 3 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "4MB" }, // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "4MB" }, // .xlsx
    "application/zip": { maxFileSize: "8MB" }, // .zip
    // The 'blob' type is a generic file type that can handle almost anything else.
    blob: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    // Set permissions for this FileRoute
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Whatever is returned here is sent to the client-side `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),

  // Your existing routes, now with authentication middleware
  image: f({ image: { maxFileSize: '4MB', maxFileCount: 5 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),

  payslipfile: f({ 
    pdf: { maxFileSize: '4MB', maxFileCount: 1 },
    image: { maxFileSize: '4MB', maxFileCount: 1 } 
  })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
