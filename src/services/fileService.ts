// Service for file operations (reading, zipping, cleanup)

export async function readImageFile(filePath: string): Promise<Uint8Array> {
  return await Deno.readFile(filePath);
}

export async function createZipFile(
  zipFileName: string,
  files: string[]
): Promise<void> {
  const zipCommand = new Deno.Command("zip", {
    args: ["-j", zipFileName, ...files],
    cwd: Deno.cwd(),
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await zipCommand.output();

  if (code !== 0) {
    throw new Error("Failed to create ZIP file");
  }
}

export async function cleanupFiles(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      await Deno.remove(file);
    } catch {
      // Ignore errors during cleanup
    }
  }
}

export function getFileSize(data: Uint8Array): string {
  return (data.length / 1024).toFixed(2);
}

