import { Command } from "commander";
import { getContext, getOutputOptions } from "../cli/program.js";
import { output, outputError, outputSuccess } from "../cli/output.js";

export function registerReferralCommands(program: Command): void {
  const referral = program
    .command("referral")
    .description("Referral management");

  referral
    .command("set")
    .description("Set referral code (link to a referrer)")
    .argument("<code>", "Referral code")
    .action(async function (this: Command, code: string) {
      const ctx = getContext(this);
      const outputOpts = getOutputOptions(this);

      try {
        const client = ctx.getWalletClient();
        const result = await client.setReferrer({ code });

        if (outputOpts.json) {
          output(result, outputOpts);
        } else {
          // Successful responses don't throw
          outputSuccess(`Referral code set: ${code}`);
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  referral
    .command("status")
    .description("Get referral status")
    .action(async function (this: Command) {
      const ctx = getContext(this);
      const outputOpts = getOutputOptions(this);

      try {
        const client = ctx.getPublicClient();
        const user = ctx.getWalletAddress();
        const result = await client.referral({ user });

        if (outputOpts.json) {
          output(result, outputOpts);
        } else {
          if (!result) {
            console.log("No referral information found");
          } else {
            output(result, outputOpts);
          }
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
