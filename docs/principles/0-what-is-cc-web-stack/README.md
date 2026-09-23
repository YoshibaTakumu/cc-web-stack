# What is cc-web-stack

English | [日本語](README.ja.md)

cc-web-stack is a meta-repository written for agents to read and execute. It turns an existing repository in the host user's environment, or a new one, into a repository that Claude Code can operate fully autonomously.

## Purpose

When people hand work to Claude Code, they keep filling in the same gaps: conventions, how to verify, what may be touched, and past decisions. cc-web-stack makes the target repository carry those itself.

"Operate fully autonomously" means:

- The agent can take a piece of work from intake through implementation, verification, review, and merge without a human filling in gaps.
- Humans only set direction and make the decisions explicitly reserved for human approval.

## Audience

- **Reader**: Claude Code. A human only tells the agent to read this repository and names the target repository.
- **Target repository**: an existing repository in the host user's environment, or a new one.

## What it provides

- **Adoption procedure**: steps for the agent to diagnose the target repository and add what is missing. In an existing repository, it adds without breaking the conventions and checks already there.
- **Agent entry points**: a layout where `AGENTS.md` / `CLAUDE.md` lead to the conventions and procedures a task needs.
- **Conventions**: naming, types, schemas, errors, and comments.
- **Mechanical checks**: conventions enforced by checks rather than prose (custom lint rules with wrappers, type checking, dependency direction, tests).
- **Runtime controls**: Claude Code hooks and permission settings.
- **Definition of done**: which verifications must pass before work may be reported as done.

## What it does not provide

- The application features of the target repository.
- Making decisions that require human approval on the human's behalf (destructive operations, publishing externally, disabling checks, etc.).
