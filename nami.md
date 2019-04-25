---
layout: minutes
date: 2019-04-19
title: JSON-LD Working Group Telco — 2019-04-19
---

# JSON-LD Working Group Telco — Minutes
{: .no_toc}
***– DRAFT Minutes –***
{: .draft_notice}

**Date:** 2019-04-19

See also the [Agenda](https://lists.w3.org/Archives/Public/public-json-ld-wg/2019Apr/0028.html) and the [IRC Log](https://www.w3.org/2019/04/24-json-ld-irc.txt)

## Attendees
{: .no_toc}
**Present:** Rob Sanderson, Gregg Kellogg, Ruben Taelman, Dave Longley, Ivan Herman, David I. Lehn

**Regrets:** Benjamin Young, Simon Steyskal, Adam Soroka, Tim Cole, Jeff Mixter, David Newbury, Pierre-Antoine Champin

**Guests:** 

**Chair:** Rob Sanderson

**Scribe(s):** Dave Longley, Ruben Taelman

## Content:
{: .no_toc}

* TOC
{:toc}
---


### 1. Approve minutes of previous call
{: #section1}

> **Proposed resolution: Approve minutes of previous call  https://www.w3.org/2018/json-ld-wg/Meetings/Minutes/2019/2019-04-12-json-ld** *(Rob Sanderson)*
{: .proposed_resolution}

> *Gregg Kellogg:* +1

> *Rob Sanderson:* +1

> *Dave Longley:* +1

> *Ruben Taelman:* +1

> *Ivan Herman:* +1

> ***Resolution #1: Approve minutes of previous call  https://www.w3.org/2018/json-ld-wg/Meetings/Minutes/2019/2019-04-12-json-ld***
{: #resolution1 .resolution}

### 2. Announcements?
{: #section2}

> *Rob Sanderson:* link: [https://developers.google.com/web/tools/lighthouse/](https://developers.google.com/web/tools/lighthouse/)

**Dave Longley:** Google Lighthouse merged jsonld.js into its master branch. Not sure when it will be released.  

### 3. Logistics
{: #section3}

**Ivan Herman:** Does Google do a blog post for releases?  

**Dave Longley:** Yes.  

**Ivan Herman:** We should watch for that and quote on our own blog.  

**Dave Longley:** Yes.  

#### 3.1. Horizontal Review
{: #section3-1}

**Rob Sanderson:** For folks on AC list -- internationalization horizontal review -- requesting for people to give the i18n group time for change, we should be good w3c citizens and help review.  
… We should start putting into motion some of the horizontal review requests.  
… Ivan, could you briefly describe what that entails?  

**Ivan Herman:** It's still a little bit messy I must say. The basic thing is, there is are some general topics i18n, security, privacy, and the TAG. These aspects should be checked in our document whenever relevant.  
… Review is done by the respective experts of these things, we already had a TAG review which is good. For each we have to have it clearly documented. We should have the right tags/labels/etc. so we can prove to the Director that we have these things.  
… It so happens that each of these areas have some sort of auto-check process. A formula that is there to get these reviews done. So we can check whether there are issues that are relevant for us or not. Either we say the issues aren't relevant or we can help the reviewers to say these are the things that seem to be relevant for us. We have to contact the necessary IG that's behind that, that's the mechanics.  
… Content-wise, what I can see is that ... let me come back to i18n. We have, I think, I don't know, if we have ever really discussed security and privacy issues, i.e. whether we have those issues. I don't remember, maybe it was discussed. I also don't remember if these issues were discussed for 1.0, because if 1.0 was OK, then we don't have (I don't think) anything new in a security/privacy sense.  
… That's up for us to find out. On the privacy side, actually, there were some noises on one of the Web of Things meetings.  
… It was forwarded a question there, whether the fact ... what kind of context files I retrieve from a site in general whether that can be used for some sort of privacy fingerprinting kind of process and whether we can do anything or think of doing anything with that.  
… Or if we have anything for the context files we receive, it may be a question we have to answer. We did have a TAG review so I think we're fine.  
… There is also Accessibility. It's a different animal in the sense in that there are two aspects. One is if our spec raises an issue, which I think is no, because our tech doesn't directly interact with the end user.  
… We may get a review to see whether our spec as a document is proper in terms of Accessibility. That may get some comments for the editors.  
… This is the general thing. I can go into the details for i18n. Any questions/issues?  

**Gregg Kellogg:** We addressed the accessibility of the images some time ago, so we're ok in that regard.  

> *Rob Sanderson:* Issues tagged with hr:*  [https://github.com/w3c/json-ld-syntax/issues/108](https://github.com/w3c/json-ld-syntax/issues/108) (defer) ; [https://github.com/w3c/json-ld-syntax/issues/147](https://github.com/w3c/json-ld-syntax/issues/147) ; [https://github.com/w3c/json-ld-syntax/issues/148](https://github.com/w3c/json-ld-syntax/issues/148) ; [https://github.com/w3c/json-ld-syntax/issues/155](https://github.com/w3c/json-ld-syntax/issues/155)

**Ivan Herman:** I hope that's the case but we have to sign it off.  

**Rob Sanderson:** 108 is the issue about meta data about contexts such that you could give it an SRI tag which is flagged as privacy and security for HR.  
… We put that into the defer bucket so we should be careful of that one.  
… There are two editorial ones 147, 148, has to do with IRI concatenation. 147 you can avoid some of the checks with relative URIs, and the URI schemes ones is that you can construct things that look like schemes and don't do that.  
… 86 I didn't put in because it's a subset. There is one in the open set, 155, IRI terms can be misdefined and it's flagged as security for HR.  

**Gregg Kellogg:** Also the case for compact IRIs.  

**Rob Sanderson:** We don't have anything for a11y or i18n.  
… We could call it out and say it's not in our scope to solve, but whether we want to open that door is a question.  

**Gregg Kellogg:** I think a blog post would be good for that.  
… It could be pointed to by a future WG.  

**Ivan Herman:** So let me give some background here. The question that does come up is that .. .when JSON-LD is used by other WGs for some sort of vocabulary like in the Web Publication now, if I use JSON-LD to express meta data where the value of the meta data is actual language text, that may be in the VCWG as well, but I may be wrong.  
… From an i18n why, you can set the language of the text BUT you cannot give the base direction of the text. When you have text that mixes up the direction like Hebrew and Latin or Arabic, so on, there are cases that go horribly wrong. Unicode does solve it for many things but not all the things. HTML has the `dir` attribute and when you have something of a manifest or meta data expressed in JSON-LD you can't use this attribute.  
… I raised this issue at the beginning of the WG.  
… The i18n guys have been working on a document for how to express i18n issues when using JSON.  
… And I got myself into a pretty long discussion with them, essentially what I tried to convince them ... and Rob I have been successful in convincing them as of three days ago ... you cannot solve something in JSON-LD you can't hack a direction into JSON-LD that's the effect today.  
… That's when we get to what Rob raised, essentially this not something that RDF can express. And JSON-LD cannot hack something on top of RDF properly. That's where the ball is, it's not in our yard. The i18n people have understood that I think and have accepted that. The question is if we move on or we have some informative text in the document that it is not possible to express, fully the direction of a text in JSON-LD.  
… And it should be done in a future version of RDF and in JSON-LD if RDF solves it.  
… This issue will come up again and again and if we document it that it cannot be done I think is a good idea, but informative obviously.  

**Gregg Kellogg:** Is there some a11y section where we'd put something like that?  

**Ivan Herman:** I think there's only a security/privacy section requirement. For i18n it would be the same level of appendix section.  
… I don't think there's a requirement for an a11y section.  

**Rob Sanderson:** An i18n section at the same level of security/privacy seems like a good thing to do rather than putting it somewhere in the text.  

**Ivan Herman:** Yes.  

**Gregg Kellogg:** So are you suggesting we add two new appendices?  
… Can we create an action for exactly what we want to do?  
… The privacy considerations would say there aren't any or are there any?  
… For example, this data format allows unencrypted information to be stored.  

**Rob Sanderson:** For privacy we could put in a recommendation for HTTPS to address unencrypted information transfer.  

**Ivan Herman:** But the question whether repeated retrieve of the same `@context` is something that can be used for fingerprinting.  

**Gregg Kellogg:** When we complete the deferred issue on the integrity checking then that might show up in that section.  

**Rob Sanderson:** Yes.  
… I think we should add a privacy section recommending HTTPS for all protocol transfers which gets us out of one thing. When we have had a chance to discuss then that would be the place to reference.  

> *Rob Sanderson:* +1

> *Ruben Taelman:* dlongley: 2 things: we should recommend https or other secure protocol

> *Ruben Taelman:* ... other thing for privacy if fingerprinting is and issue for you, then contexts can be stored offline or cached.

> *Ruben Taelman:* ... same issue for anything that has a URI in it

> *Ruben Taelman:* ivan: security and integrity issues, refer to future work on signatures on json-ld?

> *Ruben Taelman:* dlongley: yes, cover that informally and say there is upcoming work

> *Ruben Taelman:* ivan: say that it is a missing bit right now

> *Ivan Herman:* -> security questionnaire: [https://w3ctag.github.io/security-questionnaire/](https://w3ctag.github.io/security-questionnaire/)

> *Ivan Herman:* -> i18n questionnaire: [https://www.w3.org/International/techniques/developing-specs?collapse](https://www.w3.org/International/techniques/developing-specs?collapse)

> *Ivan Herman:* -> a11y questionnaire: [https://w3c.github.io/apa/fast/checklist.html](https://w3c.github.io/apa/fast/checklist.html)

**Gregg Kellogg:** Did we determine we needed an a11y section?  

**Ivan Herman:** We have to cross section, we did it once with a checklist and maybe we're fine but we should do that.  

**Rob Sanderson:** We could divide up responsibilities... Pierre-Antoine for security...  

**Gregg Kellogg:** We point to IANA and we could already be comprehensive.  

**Rob Sanderson:** I'm happy to the a11y one and given Benjamin's position and being part of the publications work, I think having him look at the i18n one would be appropriate.  

**Ivan Herman:** We will have some section/paragraph on the `dir` issue. That's something that we might take over when the time comes.  

**Gregg Kellogg:** I think describing, maybe not here, but in Best Practices using HTML content in order to get that, which is certainly unsatisfying, it's the best we have now. It provides a one-stop shop for what people are trying to go for.  

**Ivan Herman:** The i18n guys just published a note on expressing these things in JSON and they are not really in favor of using that. For all kinds of reasons. For most of the cases, actually, the extra unicode that you can put in a string is also a possibility.  

**Gregg Kellogg:** Certainly, that's what you'd want to do as a first choice. As I recall from observing that conversation there are many cases where that fails.  

**Ivan Herman:** Yes, but the right solution is to get `dir` into RDF.  

**Gregg Kellogg:** During the period where that is not available, then either avoid ... through editorial massaging of the text including those markers to avoid those problems or do you think we should not describe the use of embedded HTML at all?  

**Ivan Herman:** I'm not sure.  

**Gregg Kellogg:** What's happening in the Publication WG?  

**Ivan Herman:** There is an acknowledgment that there certain situations that cannot be covered and that's the way it is. There was a universal pushback of using the HTML thing.  
… Bringing in an HTML parser or partial parser to handle things for something like that.  
… These are details.  
… Let's not go there for now.  

#### 3.2. reviews requested
{: #section3-2}

**Rob Sanderson:** We have had some reviews requested of us, from WoT and OGC (?).  
… The WoT has sent the chairs a link. We need to clarify exactly what they want a review of.  

**Gregg Kellogg:** I pointed to that OGC, Pierre-Antoine spent some time to look through it. They said our descriptions of JSON-LD are too confusing and they created their own summary, but this resulted in some conflation with object and data types.  

> *Rob Sanderson:* +1 to primer as solution to this

**Gregg Kellogg:** This highlights the need for a primer in order to provide a simpler introduction to things for groups like this.  
… And to clarify the use of data types and not confusing literals, etc.  
… They also referred to a lack of support for lists of lists which we do of course support in 1.1.  

**Rob Sanderson:** I think it's Adam and Benjamin on the Primer.  

**Ivan Herman:** I think this is a document that we should begin to have in some shape ASAP.  

**Rob Sanderson:** For the OGC, are you sending a written response ... or? We will write a primer and refer them to it?  

**Gregg Kellogg:** They asked if we'd share the link with the CG. I shared it with the WG, any feedback is welcome.  

**Rob Sanderson:** At the very least we can say your points are well taken and we're working on this in the primer document.  

> *Rob Sanderson:* +1 to dave/manu

**Dave Longley:** Manu would say that we have to cleanup spec and clearer for people to understand  
… too much technical jargon too early, like blank nodes  
… a lot of readers have no idea what these things are  
… spec itself should be cleaned up and grade-level for reading.  

**Gregg Kellogg:** blank nodes are needed  

**Dave Longley:** yes, but should be pushed further away  
… we have an issue if we expect that non-tech people should just look at primer.  

> *Dave Longley:* +1 i also have sympathy for gregg on that

**Ivan Herman:** Hard for Gregg here because he's so well steeped in all the technology.  
… It would be nice for someone like Manu to come in with concrete text.  

> *Ruben Taelman:* azaroth_: suggestions: blank nodes further down would be valuable

> *Ruben Taelman:* dlongley: +1

> *Ruben Taelman:* dlongley: primer is good fallback

> **Summary: Manu could provide us with a text...** *(Gregg Kellogg)*
{: .summary}

**Gregg Kellogg:** Pierre-Antoine has been great here and perhaps we can lean more on him.  
… The standard for 1.0 was to keep the text simple enough so that a Primer was not necessary. I think that ship has sailed. We've added enough advanced features here that the spec is becoming hard to keep from being overwhelming.  
… Being able to read a spec with fresh eyes is a skill I have yet to master. We can all help out with that. Section 1 should be general enough for people with general knowledge to go through. But once you get beyond that it's inevitable that you're going to need more knowledge. Sections 1-3 should let readers come away with a reason able understanding of what JSON-LD intends to do and how.  
… And if you have more details thoughts you can reasonable navigate your way in the rest of the spec from there for the things you're interested in and Ivan has helped with that organization so people can find what they're interested in.  

### 4. Issues
{: #section4}

#### 4.1. language aliasing
{: #section4-1}

> *Rob Sanderson:* link: [https://github.com/w3c/json-ld-syntax/issues/158](https://github.com/w3c/json-ld-syntax/issues/158)

**Rob Sanderson:** Unless there are other people that are interested in this particular topic, I'm happy to close it.  
… We can alias `@none` to just `none` to get rid of `@` [presumably that's what Rob said].  

**Gregg Kellogg:** Aliasing lets us alias IRIs and keywords, but that's it.  
… Because `@none` is a keyword, we can alias it but we can't alias arbitrary string values.  

**Rob Sanderson:** Yes, the thought was if we wanted to let some way of aliasing more things then `en-us` could be aliased to `en_us` for example. But as Gregg said that means introducing a new feature to do this. Unless there's interest, I'm ready to close.  

> **Proposed resolution: Close syntax #158 won't fix, too complicated for the value gained** *(Rob Sanderson)*
{: .proposed_resolution}

> *Rob Sanderson:* +1

> *Gregg Kellogg:* +1

> *Ruben Taelman:* +1

> *Ivan Herman:* +1

> *Dave Longley:* +1

> ***Resolution #2: Close syntax #158 won't fix, too complicated for the value gained***
{: #resolution2 .resolution}

> *David I. Lehn:* +1

#### 4.2. Class-scoped framing
{: #section4-2}

> *Rob Sanderson:* link: [https://github.com/w3c/json-ld-framing/issues/29](https://github.com/w3c/json-ld-framing/issues/29)

**Rob Sanderson:** The idea here ... instead of having framing on only predicates to also have it on classes, whenever you find a resource of type X you use this subframe. But we'd deferred #38 and this seems to be a subtopic of that.  

**Gregg Kellogg:** Deferred just means we're not working on this now. Or do you mean defer into another WG?  

**Rob Sanderson:** Well, defer and we'll see what happens.  

**Ivan Herman:** Wait, we're getting to feature freeze. Whatever is deferred at feature freeze means it goes to another version.  

**Gregg Kellogg:** I think it meant we weren't accepting new proposals. It's still on the docket to work on, but the WG might decide to defer to a later version.  

**Ivan Herman:** Deferring means that this will not be part of the upcoming version of JSON-LD.  

**Gregg Kellogg:** Ok, I'm not prepared to say that for this or other things we've said "deferred" to.  

**Rob Sanderson:** I've also thought that way, not necessarily closing. If not we're going to do it we should close.  
… SRI and references to meta data we should continue to discuss it even though they are deferred.  

**Ivan Herman:** As soon as we are CR we freeze it. For our own time tables we have to have a point where we freeze it for ourselves as well. At that point, if we say "defer" ... "if after publishing a new REC, this group or any other group should look at this feature"  

**Rob Sanderson:** I'm fine with subtly changing the semantics of "defer" when we're in feature freeze. We should take those things that we've marked as defer as "in or out"  

**Gregg Kellogg:** I think we should decide on the next call specific features we're going to work on for this version. Otherwise it's going to be nebulous. It's premature to say those things that don't get into this WD are deferred. We need to prioritize issues and set a time by which we will have finalized them.  

**Ivan Herman:** We are dangerously close to that.  

> *Rob Sanderson:* +1

**Gregg Kellogg:** So that's the topic for the next call.  

**Rob Sanderson:** How about for now we defer based on #38?  

**Ivan Herman:** Let's close the topic for now and then look at all these in general.  

> **Proposed resolution: defer framing #29 to be discussed for inclusion in a future call** *(Rob Sanderson)*
{: .proposed_resolution}

> *Gregg Kellogg:* +1

> *Ruben Taelman:* +1

> *Rob Sanderson:* +1

> *Ivan Herman:* +1

> *Dave Longley:* +1

> *David I. Lehn:* +1

> ***Resolution #3: defer framing #29 to be discussed for inclusion in a future call***
{: #resolution3 .resolution}

**Rob Sanderson:** Thanks everyone!  
… We will talk about the issues currently tagged as defer and what makes the cut next week.  

### 5. Adjourn
{: #section5}

---


### 6. Resolutions
{: #res}

* [Resolution #1](#resolution1): Approve minutes of previous call  https://www.w3.org/2018/json-ld-wg/Meetings/Minutes/2019/2019-04-12-json-ld
* [Resolution #2](#resolution2): Close syntax #158 won't fix, too complicated for the value gained
* [Resolution #3](#resolution3): defer framing #29 to be discussed for inclusion in a future call
No new actions

