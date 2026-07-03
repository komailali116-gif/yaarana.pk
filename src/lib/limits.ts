import { supabase } from "../supabaseClient";

/**
 * Counts the number of custom-uploaded images in the "app-files" bucket
 * under the user's specific subfolder and database record count.
 * @param uid The current user's authenticated ID
 */
export async function countUploadedPics(uid: string): Promise<number> {
  if (!uid || uid === "anonymous") {
    return 0;
  }

  let fileCount = 0;
  try {
    // 1. List folders under `${uid}/companions/`
    const { data: folders, error: folderError } = await supabase.storage
      .from("app-files")
      .list(`${uid}/companions`);
      
    if (!folderError && folders) {
      for (const folder of folders) {
        // List files in each companion folder
        const { data: files, error: fileError } = await supabase.storage
          .from("app-files")
          .list(`${uid}/companions/${folder.name}`);
          
        if (!fileError && files) {
          // Count files (ignore folders if any exist at this level)
          const validFiles = files.filter(f => f.metadata && f.id);
          fileCount += validFiles.length;
        }
      }
    }
  } catch (err) {
    console.error("Error listing storage files for limit check:", err);
  }

  let dbCount = 0;
  try {
    // 2. Count active db records where avatar points to custom storage path
    const { data: dbComps, error: dbError } = await supabase
      .from("companions")
      .select("avatar")
      .eq("user_id", uid);
      
    if (!dbError && dbComps) {
      dbCount = dbComps.filter(c => 
        c.avatar && 
        !c.avatar.startsWith("http://") && 
        !c.avatar.startsWith("https://") && 
        !c.avatar.startsWith("data:")
      ).length;
    }
  } catch (err) {
    console.error("Error querying companions count for limit check:", err);
  }

  // Use the maximum of physical storage files and active db references to prevent RLS bypass
  return Math.max(fileCount, dbCount);
}
