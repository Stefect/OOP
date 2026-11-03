import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { Editor } from "./Editor.js";

const PROMPT = "> ";
const EXIT_COMMAND = "exit";

export class CliApplication {
  #editor;
  #input;
  #output;

  constructor(editor = new Editor(), input = stdin, output = stdout) {
    this.#editor = editor;
    this.#input = input;
    this.#output = output;
  }

  async run() {
    const rl = createInterface({ input: this.#input, output: this.#output, prompt: PROMPT });
    let isClosed = false;
    rl.on("close", () => {
      isClosed = true;
    });

    this.#output.write("Векторний графічний редактор. Введіть help для довідки.\n");
    rl.prompt();

    for await (const line of rl) {
      if (line.trim().toLowerCase() === EXIT_COMMAND) {
        break;
      }

      try {
        const result = await this.#editor.execute(line);
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
}

const application = new CliApplication();
application.run();