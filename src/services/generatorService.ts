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
    stdout: "piped",
    stderr: "piped",
  });

  console.log(`[Generator] Running: deno run ${scriptPath}`);
  
  const { code, stdout, stderr } = await command.output();
  
  console.log(`[Generator] Process exited with code: ${code}`);
  
  return {
    success: code === 0,
    stdout,
    stderr,
    code,
  };
}

