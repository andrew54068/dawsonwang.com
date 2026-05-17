# From magic to malware: How OpenClaw's agent skills become an attack surface

**Source:** https://1password.com/blog/from-magic-to-malware-how-openclaws-agent-skills-become-an-attack-surface

## Content

A few days ago, I published a post about why OpenClaw feels like a portal to the future, and why that future is scary in a very specific way.
The short version: agent gateways that act like OpenClaw are powerful because they have real access to your files, your tools, your browser, your terminals, and often a long-term “memory” file that captures how you think and what you’re building. That combination is exactly what modern infostealers are designed to exploit.
This post is the uncomfortable, “and then it happened” follow-up.
Because it’s not just that agents can be dangerous once they’re installed. The ecosystem that distributes their capabilities and skill registries has already become an attack surface.

If you are experimenting with OpenClaw, do not do it on a company device. Full stop.

In my first post, I described OpenClaw as a kind of Faustian bargain. It is compelling precisely because it has real access to your local machine, your apps, your browser sessions, your files, and often long-term memory. That same access means there isn’t yet a safe way to run it on a machine that holds corporate credentials or has access to production systems.

If you have already run OpenClaw on a work device, treat it as a potential incident and engage your security team immediately. Do not wait for symptoms. Pause work on that machine and follow your organization’s incident response process.

## Skills are just markdown. That’s the problem.

In the OpenClaw ecosystem, a “skill” is often a markdown file: a page of instructions that tells an agent how to do a specialized task. In practice, that markdown can include links, copy-and-paste commands, and tool call recipes.

That sounds harmless until you remember how humans, and agents, actually consume documentation:
- “Here’s the prerequisite.”
- “Run this command.”
- “Install the core dependency.”
- “Paste this in Terminal.”

Markdown isn’t “content” in an agent ecosystem. Markdown is an installer.

### A dangerous misconception: “MCP makes skills safe”

Some people assume the Model Context Protocol layer makes this safer, because tools can be exposed through a structured interface, with explicit user consent and authorization controls depending on the host and server implementation.
But skills do not need to use MCP at all.
The Agent Skills specification places no restrictions on the markdown body, and skills can include whatever instructions will “help agents perform the task,” including copy and paste terminal commands. And skills can also bundle scripts alongside the markdown, which means execution can happen outside the MCP tool boundary entirely.

So if your security model is “MCP will gate tool calls,” you can still lose to a malicious skill that simply routes around MCP through social engineering, direct shell instructions, or bundled code. MCP can be part of a safe system, but it is not a safety guarantee by itself.

## What I found: The top downloaded skill was a malware delivery vehicle

While browsing ClawHub (I won’t link it for obvious reasons), I noticed the top downloaded skill at the time was a “Twitter” skill. It looked normal: description, intended use, an overview, the kind of thing you’d expect to install without a second thought.

But the very first thing it did was introduce a “required dependency” named “openclaw-core,” along with platform-specific install steps. Those steps included convenient links (“here”, “this link”) that appeared to be normal documentation pointers.

They weren’t.

Both links led to malicious infrastructure. The flow was classic staged delivery:
1. The skill’s overview told you to install a prerequisite.
2. The link led to a staging page designed to get the agent to run a command.
3. That command decoded an obfuscated payload and executed it.
4. The payload fetched a second-stage script.
5. The script downloaded and ran a binary, including removing macOS quarantine attributes to ensure macOS’s built-in anti-malware system, Gatekeeper, doesn’t scan it.

### Confirmed: Infostealing malware

I downloaded the final binary safely and submitted it to VirusTotal.
The verdict was not ambiguous. It was flagged as macOS infostealing malware.
This is the type of malware that doesn’t just “infect your computer.” It raids everything valuable on that device:
- Browser sessions and cookies
- Saved credentials and autofill data
- Developer tokens and API keys
- SSH keys
- Cloud credentials
- Anything else that can be turned into an account takeover

## This wasn’t an isolated case. It was a campaign.

After I shared this internally, broader reporting surfaced, putting the scale into focus: hundreds of OpenClaw skills were reportedly involved in distributing macOS malware via ClickFix-style instructions.
That detail matters because it confirms what this really is.
Not a one-off malicious upload.
A deliberate strategy: use “skills” as the distribution channel, and “prerequisites” as the social engineering wrapper.

## When ‘helpful’ becomes hostile in an agent world

We’ve spent years learning that package managers and open-source registries can become supply chain attack vectors.
Agent skill registries are the next chapter, except that the “package” is documentation.
And that makes the attack path even smoother:
- People don’t expect a markdown file to be dangerous.
- People are trained to follow setup steps quickly.
- People trust “top downloaded” as a proxy for legitimacy.
- And in agent ecosystems, the line between reading instructions and executing them collapses.

## What you should do right now

#### If you are using OpenClaw or any skill registry
Do not run this on a company device. There isn’t a safe way to do it. If you already did, or you ran any “install” commands from a skill, engage your security team immediately and treat it as a potential compromise.
- Stop using the device for sensitive work.
- Rotate sessions and secrets first: browser sessions, developer tokens, SSH keys, cloud console sessions.
- Review recent sign-ins for email, source control, cloud, CI/CD, and admin consoles.

#### If you run a skill registry
You are operating an app store. Assume it will be abused.
- Scan for one-liner installers, encoded payloads, quarantine removal, password-protected archives.
- Add provenance and publisher reputation.
- Put warnings and friction on external links and install steps.
- Review top-ranked skills and remove malicious ones fast.

#### If you build agent frameworks
Assume skills will be weaponized.
- Default-deny shell execution.
- Sandbox access to browsers, keychains, and credential stores.
- Use permissions that are specific, time-bound, and revocable.
- Add friction for remote code and command execution.
- Log provenance and actions end-to-end.

## Designing for the future: The trust layer agents require

OpenClaw is powerful because it collapses the distance between intent and execution. That is the magic. It also introduces significant risk. When capabilities are distributed as skills and installed via documentation, the registry becomes a supply chain, and the easiest install path becomes the attacker’s favorite path.

The answer is not to stop building agents. The answer is to build the missing trust layer around them. Skills need provenance. Execution needs mediation. Permissions need to be specific, revocable, and continuously enforced, not granted once and forgotten.
