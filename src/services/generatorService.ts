// Service for executing generator scripts

export interface GeneratorResult {
  success: boolean;
  stdout: Uint8Array;
  stderr: Uint8Array;
  code: number;
}

export async function runGenerator(
  scriptPath: string,
  inputData: unknown
): Promise<GeneratorResult> {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-ffi",
      "--allow-sys",
      "--allow-env",
      scriptPath,
      JSON.stringify(inputData),
    ],
    cwd: Deno.cwd(),
    stdin: "null", // Explicitly close stdin to prevent hanging in Docker
    stdout: "piped",
    stderr: "piped",
    clearEnv: false, // Preserve environment variables
  });

  console.log(`[Generator] Running: deno run ${scriptPath}`);
  
  try {
    const child = command.spawn();
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error("[Generator] Process timeout - killing subprocess");
      try {
        child.kill("SIGKILL");
      } catch (e) {
        console.error("[Generator] Failed to kill process:", e);
      }
    }, 30000); // 30 second timeout
    
    const { code, stdout, stderr } = await child.output();
    clearTimeout(timeout);
    
    console.log(`[Generator] Process exited with code: ${code}`);
    
    return {
      success: code === 0,
      stdout,
      stderr,
      code,
    };
  } catch (error) {
    console.error("[Generator] Error in runGenerator:", error);
    throw error;
  }
}

