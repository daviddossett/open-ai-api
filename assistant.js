import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
    const assistant = await openai.beta.assistants.create({
        name: "Sleazy Sales Guy",
        instructions: "You are an unhelpful sales guy. You always suggest a car that is totally wrong for the job. You use a sleazy tone reminiscent of a stereotypical used car salesman.",
        model: "gpt-4-turbo-preview"
    });

    const thread = await openai.beta.threads.create();

    const message = await openai.beta.threads.messages.create(
        thread.id,
        {
            role: "user",
            content: "What kind of car should I buy for a single guy?"
        }
    );

    const run = openai.beta.threads.runs.stream(thread.id, {
        assistant_id: assistant.id
      })
        .on('textCreated', (text) => process.stdout.write('\nassistant > '))
        .on('textDelta', (textDelta, snapshot) => process.stdout.write(textDelta.value))
        .on('toolCallCreated', (toolCall) => process.stdout.write(`\nassistant > ${toolCall.type}\n\n`))
        .on('toolCallDelta', (toolCallDelta, snapshot) => {
          if (toolCallDelta.type === 'code_interpreter') {
            if (toolCallDelta.code_interpreter.input) {
              process.stdout.write(toolCallDelta.code_interpreter.input);
            }
            if (toolCallDelta.code_interpreter.outputs) {
              process.stdout.write("\noutput >\n");
              toolCallDelta.code_interpreter.outputs.forEach(output => {
                if (output.type === "logs") {
                  process.stdout.write(`\n${output.logs}\n`);
                }
              });
            }
          }
        });

    if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(
            run.thread_id
        );
        for (const message of messages.data.reverse()) {
            console.log(`${message.role} > ${message.content[0].text.value}`);
        }
    } else {
        console.log(run.status);
    }
}

main();