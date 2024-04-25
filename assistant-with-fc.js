import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
    const assistant = await openai.beta.assistants.create({
        name: "Porsche Salesmen",
        instructions: "Your task is to help the user find the right Porsche for them.",
        model: "gpt-4-turbo-preview",
        tools: [
            {
                type: "function",
                function: {
                    name: "get_model_price",
                    description: "Returns the price of the model that the user is interested in",
                    parameters: {
                        type: "object",
                        properties: {
                            model: {
                                type: "string",
                                description: "The model of Porsche that the user is interested in."
                            },
                        },
                        required: ["model"],
                    }
                }
            }
        ]
    });

    const thread = await openai.beta.threads.create();

    const message = await openai.beta.threads.messages.create(
        thread.id,
        {
            role: "user",
            content: "I want to buy a porsche Cayman"
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
}

main();