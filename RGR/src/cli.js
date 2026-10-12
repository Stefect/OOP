import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { Editor } from "./Editor.js";

const PROMPT = "> ";
const EXIT_COMMAND = "exit";

async function run() {
  const editor = new Editor();
  const rl = createInterface({ input: stdin, output: stdout, prompt: PROMPT });
  let isClosed = false;
  rl.on("close", () => {
    isClosed = true;
  });

  console.log("Векторний графічний редактор. Введіть help для довідки.");
  rl.prompt();

  for await (const line of rl) {
    if (line.trim().toLowerCase() === EXIT_COMMAND) {
      break;
    }

    try {
      const result = await editor.execute(line);
      if (result) {
        console.log(result);
      }
    } catch (error) {
      console.log(`Помилка: ${error.message}`);
    }

    if (!isClosed) {
      rl.prompt();
    }
  }

  rl.close();
}

run();
