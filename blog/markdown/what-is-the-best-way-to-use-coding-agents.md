---
title: What is the Best Way to Use Coding Agents?
description: I have been experimenting with coding agents for a while, and in this post, I share some of my learnings, observations, and their quirks. Feel free to take a look, comment or share your ideas and thoughts about it with me.
keywords: llm, cost, thoughts, agents, code
date: April 14, 2026
og_image: https://sarveshbhatnagar.com/images/user-3.jpg
og_url: https://sarveshbhatnagar.com/blog/what-is-the-best-way-to-use-coding-agents
---

# Introduction

I’ve been using coding agents very actively still, nowhere near the [“$250K usage”](https://www.businessinsider.com/jensen-huang-500k-engineers-250k-ai-tokens-nvidia-compute-2026-3) benchmark that recently came up in the industry headlines, it’s still significant in my view. Maybe I *am* the frog in the well but I’m learning, just as I did (and still do) as a software developer.

You might wonder why I’m starting with cost. The reason is simple: the industry increasingly uses these numbers as a proxy for how deeply someone is engaging with LLMs—sometimes even more than actual impact. Initially, I thought this was a flawed metric. Now, I’m not so sure.

It may not be perfect, but it *does* signal experimentation, curiosity, and iteration; qualities that matter when working with LLMs. I see myself as someone actively learning, experimenting, and building workflows to understand how this space is evolving and co-exist with it.

With that context, here are some of my key learnings:

- **Learning 1:** Use LLMs to explore, learn, and brainstorm heavily  
- **Learning 2:** Don’t trust LLMs blindly: they hallucinate and make poor decisions  
- **Learning 3:** Rein in generative LLMs with critical thinking and delegation  
- **Learning 4:** Leverage community groundwork aggressively  
- **Learning 5:** The developer’s role is shifting from implementer to reader and director  
- **Learning 6:** Make peace with delegation  

---

# What Have I Been Doing?

Over the past year, I’ve gone through multiple phases—starting as a skeptic (back when coding agents like GitHub Copilot were just emerging), then becoming a fan, then skeptical again, and now settling somewhere in between.

This back-and-forth came from hands-on experience. I’ve used coding agents across:

- Personal projects  
- Production systems  
- Learning and research  
- General problem-solving  

One thing I’ve realized: the real bottleneck is no longer writing code—it’s **processing and validating information**. It’s mentally taxing to read, verify, and reason through everything these systems generate. Sometimes I trust too easily; other times I overanalyze.

That balance is still something I’m figuring out.

---

## Learning 1: Use LLMs to Explore, Learn, and Brainstorm Heavily

LLMs are excellent for exploration. They help you:

- Generate ideas  
- Identify patterns  
- Explore solution spaces quickly  

However, they are still limited by their training data. They tend to stay within the setting, e.g. if your project is bad, it will keep going down the rabid hole. I have found that providing extra outside samples have worked at times for it to think outside at times.

Remember: LLMs are token predictors. Better input → better output.

---

## Learning 2: Don’t Trust LLMs Blindly

LLMs can and will make bad decisions.

I learned this the hard way. In one project, I relied too heavily on an LLM for design decisions. It made fragile architectures which had poor extensibility and constant regressions (fixing one thing would break another). For this, active reading helped. My general workflow currently is as follows - I delegate completely, look for key flow on how things are going and see if the flow has flaws, if it does I tell the agent to change it and fix the same, else I do a second pass review with more in depth take.

---

## Learning 3: Rein in Generative LLMs with Critical Thinking and Delegation

LLMs generate—they don’t reason deeply.

One approach that worked well for me:

- Use **multiple agents**  
- Let independent agents review each other’s output  
- Avoid sharing full context across all agents  

This often surfaces flaws in reasoning.

It’s similar to the concept of extended cognition—using external systems to improve thinking. Here, LLMs become *thinking collaborators*, not just tools.

But the key responsibility still lies with you:

- Understand what’s being generated  
- Evaluate trade-offs  
- Anticipate future issues  

---

## Learning 4: Use Community Groundwork Heavily

The community is moving incredibly fast:

- New tools  
- New workflows  
- New abstractions  

You don’t need to reinvent everything.

Actively:

- Follow what others are building  
- Reuse proven patterns  
- Adapt instead of starting from scratch 
- Starting from scratch at times is okay for better exploration (personal thoughts)

---

## Learning 5: The Developer’s Role Is Changing

The role is shifting from:

- **Implementer → Reader + Director**

You now:

- Read large volumes of generated code  
- Validate correctness and design  
- Guide systems rather than build everything manually  

The bottleneck is no longer typing—it’s **thinking and decision-making**.I believe this has been the case, now or in the past as well. Developer's job has always been thinking deeply.

---

## Learning 6: Make Peace with Delegation

This is the hardest but most important shift.

To truly benefit from LLMs:

- Delegate entire tasks—not just small pieces  
- Let agents build end-to-end systems  
- Iterate afterward  

Yes, they will make mistakes. That’s expected.

But if you:

- Review carefully  
- Understand deeply  
- Refactor where needed  

You’ll still move significantly faster. If you don’t fully delegate, you’re not unlocking their real value—you’re just using them as autocomplete. And that won’t differentiate you.

---

# Final Thoughts

LLMs are not magic—they are powerful but flawed collaborators. We will have to learn to co-exist by being better thinkers and know when to trust and when not to.