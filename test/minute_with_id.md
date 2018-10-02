---
layout: minutes
date: 2018-09-10
title: Publishing Working Group Telco — 2018-09-10
---

# Publishing Working Group Telco — Minutes
{: .no_toc}
***– DRAFT Minutes –***
{: .draft_notice}

**Date:** 2018-09-10

See also the [Agenda](https://lists.w3.org/Archives/Public/public-publ-wg/2018Sep/0000.html) and the [IRC Log](https://www.w3.org/2018/09/10-pwg-irc.txt)

## Attendees
{: .no_toc}
**Present:** Matt Garrish, Avneesh Singh, Dave Cramer, Jeff Buehler, George Kerscher, Nick Ruffilo, Ivan Herman, Chris Maden, Zheng Xu, Gregorio Pellegrino, Ric Wright, Charles LaPierre, Joshua Pyle, Franco Alvarado, Jun Gamou, Benjamin Young, Garth Conboy, Juan Corona, Marisa DeMeglio, Ben Schroeter, Laurent Le Meur, Caitlin Gebhard, Ben Walters, Mustapha Lazrek, Derek Jackson

**Regrets:** Rachel Comerford, Tzviya Siegman, Murata Makoto, Vladimir Levantovsky, Hadrien Gardeur, Deborah Kaplan, Brady Duga, Luc Audrain, Tim Cole, Romain Deltour, David Stroup

**Guests:** 

**Chair:** Garth Conboy

**Scribe(s):** Nick Ruffilo

## Content:
{: .no_toc}

* TOC
{:toc}
---


> *Garth Conboy:* [https://www.w3.org/publishing/groups/publ-wg/Meetings/Minutes/2018/2018-08-27-pwg.html](https://www.w3.org/publishing/groups/publ-wg/Meetings/Minutes/2018/2018-08-27-pwg.html)

<span id="id_0">**<a href="#id_0">Garth Conboy</a>:**</span> Meeting minutes approved...  

> ***Resolution #1: Last meeting's minutes approved***
{: #resolution1 .resolution}

### 1. issue 291, TOC
{: #section1}

> *Garth Conboy:* [https://github.com/w3c/wpub/issues/291](https://github.com/w3c/wpub/issues/291)

<span id="id_1">**<a href="#id_1">Garth Conboy</a>:**</span> Last week, Monday, there was no meeting due to US Labor Day.  There was discussion on the call on issue #291 - we got to a semi-consensus that we'd have two - one for referencing and one for machine processing.  Those, not including me, hung on the call and that rough consensus evaporated.  There has been more discussion...  
…  the most recent was that this was a proposal that Ivan put together on having a single point of context that could be used to process the renderable one into something that is more machine readable.  And getting hierarchy around the lists.  That's sort of where we are...  

> *Garth Conboy:* [https://github.com/w3c/wpub/issues/291#issuecomment-417554685](https://github.com/w3c/wpub/issues/291#issuecomment-417554685)

<span id="id_2">**<a href="#id_2">Ivan Herman</a>:**</span> In some sense, I think we're in a deadlock.  One approach is to have a clear algorithm in the spec that say "this is how - from this HTML over there - the hierarchical menu is created" - which is fine.  For the time being, we don't have that algorithm.  My personal belief is that just having an algorithm without some sort of definition of how the toc looks like would be incredibly difficult.  If we define some sort of structure then the algorithm should be put in the spec.  Then my proposal goes that the way it would operate from the user is that the algorithm would then be the toc; if the algorithm fails, the user agent should simply play the HTML content that is there.  

<span id="id_3">**<a href="#id_3">Dave Cramer</a>:**</span> I'm an advocate for 'define an algorithm' but I'm not a JS expert, although I'm sure we can create an algorithm that creates the hierarchy.  I would really like to see what such an algorithm would do to some real-life table of contents before we go much further...  

<span id="id_4">**<a href="#id_4">Ivan Herman</a>:**</span> Having javascript algorithm that could take any HTML would be terribly complicated and would be about the organization of the DOM...  I looked at some examples that are more anecdotal about what Table of Contents are out there, I looked at ones that were generated and not human-created. I think there was only one exception - most are essentially a NAV or a UL or OL with the LI as the children, which is the natural thing to do with a table of contents.  The other possibility is to use H1,H2, H3 to specify hierarchy.  

<span id="id_5">**<a href="#id_5">Jeff Buehler</a>:**</span> I wrote a number of scripts (node JS) that parse out TOCs and create TOCs, generally from spreadsheets and CSVs.  There's some relationship there that might be helpful.  It generates TOCs from CSVs.  
…  The hierarchy is pretty brute force - i'm not using DOM parsing, I'm using regular expressions.  There are some tags required for specific elements, but it might be helpful for anyone working on this.  It's been tested over a few years, so it definitely works.  

<span id="id_6">**<a href="#id_6">Garth Conboy</a>:**</span> I tend to agree with ivan that I am very much in the camp that one of the successful things we did in epub was the NAV file, but it doesn't sound that view of the world is going to get traction here, but we might revisit in epub4 land.  I don't see any other way forward other than accepting ivan's suggestion that we'll have a placeholder for, but there doesnt' seem to be consensus support to have 2 TOCs.  
…  It seems to me that is where we are.  But maybe we do a brief poll for consensus for accepting Ivan's language with an algorithm TBH to be defined and experimented with.  

<span id="id_7">**<a href="#id_7">Ivan Herman</a>:**</span> I think we need to modify a bit - we should leave it open and give ourselves a certain amount of time to see if such and algorithm can be created.  If it cannot be created, then we need a combination of what's in epub3, making a reference to this issue - that for me seems to be the best option.  

<span id="id_8">**<a href="#id_8">Garth Conboy</a>:**</span> The best thing you said is that come back in a month - which happens to be TPAC - so that could be an interesting approach.  

<span id="id_9">**<a href="#id_9">Matt</a>:**</span> I was going to agree with Ivan - I am not of the belief that completely random HTML will become structured TOC.  The middle ground we might find here is that there is a recommended way of doing a TOC - so YMMV if you don't go with the recommended structure for TOC...  

> *Joshua Pyle:* +1 to recommended structure for TOCS

<span id="id_10">**<a href="#id_10">Matt</a>:**</span>  I want to sit on the fence that it's required of epub but not necessarily epub, and just note there are better ways to do it.  

<span id="id_11">**<a href="#id_11">George Kerscher</a>:**</span> Would it be helpful for us to gather a collection of recommendations on how to do it?  For example, if you've got a collection of content documents - how to traverse those files and extract the things you want to put in the TOC?  

<span id="id_12">**<a href="#id_12">Garth Conboy</a>:**</span> That sort of strikes me as - building a TOC from a whole cloth - this discussion is about how free can we be with an actual doc-TOC but without looking at it from the reading order  

<span id="id_13">**<a href="#id_13">George Kerscher</a>:**</span> I don't know how this will be created.  I've seen TOCs where the names in the doc-toc do not align with the content in your document.  

<span id="id_14">**<a href="#id_14">Garth Conboy</a>:**</span> we do have a requirement in the current spec that there must have a TOC identified, and it must point to an element identified as doc-toc.  If it's wrong and points to things that don't exist, that's the documents fault.  

<span id="id_15">**<a href="#id_15">Dave Cramer</a>:**</span> The key here is that it's the author's responsibility to create a TOC.  They know how to best facilitate access to their content.  We're spending time assuming the User Agent needs to do anything beyond displaying the documents table of contents.  I'm not sure how this fits into the web publication world, if we take the word web seriously.  It's not standard for a UA to search for nav elements.  

<span id="id_16">**<a href="#id_16">Garth Conboy</a>:**</span> I think it's very arguable on either side on the WP side.  When we get to epub4, we'll want the reading system to be able to do things with the TOC, but lets not argue that thing now.  

<span id="id_17">**<a href="#id_17">Ivan Herman</a>:**</span> I want to make reminders that the TOC is not a required element.  if the author doesn't want the User Agent to do something, they won't create a DOC-TOC element.  We are not contradicting.  There is no problem with a creator doing what they want.  

> *Garth Conboy:* [https://github.com/w3c/wpub/issues/291#issuecomment-417554685](https://github.com/w3c/wpub/issues/291#issuecomment-417554685)

<span id="id_18">**<a href="#id_18">Garth Conboy</a>:**</span> I would like to propose consensus on Ivan's comments, but proposes an algorithm and/or set of constraints we might place on the table of contents if the algorithm is successful - take a few weeks to TPAC, and if we've gotten somewhere...  

> *Garth Conboy:* +1

<span id="id_19">**<a href="#id_19">Garth Conboy</a>:**</span>  We would have some constraints, and if the algorithm is not successful then just display the HTML.  If that is acceptable to folks, I will go ahead and be the token +1  

> *Jeff Buehler:* +1

> *Ivan Herman:* +1

> *Joshua Pyle:* +1

> *Ric Wright:* +1

> *Zheng Xu:* +1

> *Juan Corona:* +1

> *Marisa DeMeglio:* +1

> *Nick Ruffilo:* +1

> *Dave Cramer:* +1

### 2. issue 276: external resource in ToC
{: #section2}

> *Garth Conboy:* [https://github.com/w3c/wpub/issues/276](https://github.com/w3c/wpub/issues/276)

<span id="id_20">**<a href="#id_20">Garth Conboy</a>:**</span> The DOC-TOC element - if it can point to resources outside of the default reading order.  I will throw out a prejudice that the thing - and Dave is going to come in saying 'it's not webby' - my initial 2 cents is that the TOC should point to items in the resources or reading order.  

<span id="id_21">**<a href="#id_21">Garth Conboy</a>:**</span> The title of the issue is: "outside the reading order" and additional resources.  If it's a publication, then the TOC should point into the publication as it's defined by the boundary.  

<span id="id_22">**<a href="#id_22">Jeff Buehler</a>:**</span> I found that over the years the TOC isn't always reliable, such as resources not available within.  The solution is to create another XML file...  

<span id="id_23">**<a href="#id_23">Garth Conboy</a>:**</span> I don't think we want the TOC to have more power, but the pointers in the DOC-TOC, whether the links in there can point only to the items within the publication.  

> *Ivan Herman:* +1 to garth

<span id="id_24">**<a href="#id_24">Garth Conboy</a>:**</span> it wouldn't pull all of that section's links into the TOC (the external links)  

<span id="id_25">**<a href="#id_25">Ivan Herman</a>:**</span> Any scholarly publication's structure, yes there's a section of references, but the TOC includes a reference to the section, but not the external links.  

<span id="id_26">**<a href="#id_26">Dave Cramer</a>:**</span> This is more a discussion of scope and boundaries than what happens if a link in a TOC goes somewhere beyond 'inside the publication'  That is a larger question we haven't really addressed.  What I have an external link elsewhere.  What happens, how do we show to the user that they have left the web publication.  

<span id="id_27">**<a href="#id_27">Garth Conboy</a>:**</span> Certainly in web publication land, Nick's suggestion of additional reading - we do agree that the default reading order + additional resources is the bounds of the publication, so - do we - for the TOC should it only fit within the bounds of the publication.  We can't prevent content creators from putting a link to whatever - but we need the rule if it is ignored or not.  

<span id="id_28">**<a href="#id_28">Joshua Pyle</a>:**</span> I tend to agree, and prefer for the TOC to be within the bounds of the publication.  What we're doing with web publications is creating the ability to bind different things together.  We could mix-and-match pages, but the point of the WP is to bind them together.  
…  The TOC should direct you within the bounds of what you've just created.  Things like references, they're all external links.  They should be separate from the TOC.  It would be frustrating for a user to click and link and leave the document.  

> *Juan Corona:* nice explanation josh +1

<span id="id_29">**<a href="#id_29">Garth Conboy</a>:**</span> We're defining a bounded collection of resources, so the TOC should point within those bounds.  

<span id="id_30">**<a href="#id_30">George Kerscher</a>:**</span> I'm envisioning reading order in the additional documents to have link relationships to other documents within the publication, whereas when you get outside the publication there is no relationship.  I'm in agreement that the TOC defined as such helps solidify this.  

<span id="id_31">**<a href="#id_31">Rick</a>:**</span> I totally agree with what Josh said - well put.  The other comment, more of a question, more relevant here.  Isn't this related to the conversation in Chicago about would we allow resources to be external to the document?  As a RS developer, that makes me nervous as it's a security concern.  

<span id="id_32">**<a href="#id_32">Garth Conboy</a>:**</span> I agree, moving within the TOC you're moving within the publication.  

<span id="id_33">**<a href="#id_33">Evan Owens</a>:**</span> within journal publishing, you have links to where the article was published, so you would be linking out to a different document/page  

<span id="id_34">**<a href="#id_34">Garth Conboy</a>:**</span> You're envisioning a page that is a pointer to other publications, but it would be a TOC?  

<span id="id_35">**<a href="#id_35">Joshua Pyle</a>:**</span> I come from the journal publishing world, and yes, an article would be a web publication.  The issue for that article would be a web publication of web publications.  In which case, the Table of Contents is - you're still within the bounds of the issue, we're still binding that.  It could be a compilation - all of that stuff...  it doesn't matter where it lives, as long as the manifest defines it as part of the publication.  
…  We have to drop the notion of domain - it's still a single web publication and the TOC is within it.  

<span id="id_36">**<a href="#id_36">Ivan Herman</a>:**</span> Slightly different question from George if someone wants to respond.  

<span id="id_37">**<a href="#id_37">Garth Conboy</a>:**</span> I thought it was well summarized as nested web publications, so the parents can point to it's children, which are part of the boundaries.  

> *Joshua Pyle:* An out-of-bounds error :-)

<span id="id_38">**<a href="#id_38">Ivan Herman</a>:**</span> Let's say we decided that a reference in a TOC should be within the bounds.  The question is, what happens if someone makes a mistake.  What is the reaction?  It's a bit like we already have requirements for a person but if a structure doesn't have a name, the structure is invalid and taking out of the list.  
…  Let's say we have a process that creates a machine readable TOC, and the algorithm realizes that one of the references is out of the doc, what should it do?  

<span id="id_39">**<a href="#id_39">Garth Conboy</a>:**</span> We clearly have to deal with that, and it comes down to if it becomes a should or a must, and what happens if you violate  

<span id="id_40">**<a href="#id_40">Matt</a>:**</span> Probably a must-not is a bit strong, we won't stop people.  It should be a recommendation for the reasons already laid out, it will be confusing to the user and leave it at that.  We're not going to force people, and reading systems are going to have to handle this.  Throwing it out is going to be odd, but when it's extracted from the reading system, it's not a place we should go, we should just recommend not doing it.  

> *Joshua Pyle:* +1 to SHOULD

<span id="id_41">**<a href="#id_41">Garth Conboy</a>:**</span> maybe this does inherently answer Ivan's question, that we can resolve this issue, at least for the moment, that the entries in the DOC-TOC table of contents should points into the bounds of the publication  

> **Proposed resolution: the entries in the DOC-TOC table of contents SHOULD point into the bounds of the publication** *(Ivan Herman)*
{: .proposed_resolution}

> *Avneesh Singh:* +1

> *Garth Conboy:* +1

> *Derek Jackson:* +1

> *Zheng Xu:* +1

> *Charles LaPierre:* +1

> *Juan Corona:* +1

> *Joshua Pyle:* +1

> *Jeff Buehler:* +1 also should, 0 to must

> *Caitlin Gebhard:* +1

> *Ivan Herman:* +1

> *Franco Alvarado:* +1

<span id="id_42">**<a href="#id_42">Garth Conboy</a>:**</span> If that is consensus, that is probably suitable for us to get in there and resolve the issue.  

> *Dave Cramer:* +1 to should, -1 to must

> *Ric Wright:* +1

> *Ben Schroeter:* +1

> *Marisa DeMeglio:* +1 should

> *George Kerscher:* +1

<span id="id_43">**<a href="#id_43">Joshua Pyle</a>:**</span> As we are specification writers, the best we can do is should, must, and must not, but it's up to implementors to determine what should happen when they come across a should/must/must-not, etc.  

<span id="id_44">**<a href="#id_44">Garth Conboy</a>:**</span> It's more incumbent on us to determine what should happen with must and must not....  

<span id="id_45">**<a href="#id_45">Ivan Herman</a>:**</span> At some point in time we will have to look at this for the document.  If there is a should or should-not, then there is a checker that should raise a warning (the difference between an error or warning) so a future epub checker could raise a warning.  

<span id="id_46">**<a href="#id_46">Dave Cramer</a>:**</span> I think we need to make distinction between HTML and the manifest.  We control the manifest, but not HTML.  We should not be making any restrictions on HTML  

> ***Resolution #2: the entries in the DOC-TOC table of contents SHOULD point into the bounds of the publication***
{: #resolution2 .resolution}

### 3. naming things, issue 312
{: #section3}

> *Garth Conboy:* [https://github.com/w3c/wpub/issues/312#issuecomment-415016624](https://github.com/w3c/wpub/issues/312#issuecomment-415016624)

<span id="id_47">**<a href="#id_47">Garth Conboy</a>:**</span> The last issue, Rachel summarized in the comment provided, this was an issue Dave raised.  Is anyone in a good position to summarize?  

<span id="id_48">**<a href="#id_48">Dave Cramer</a>:**</span> Because we're inheriting tons of terminology from schema.org they have set names for items, that don't always match up with publishing, what we call a title, schema calls it a name.  So a book title would have to be a "name" so there is a bit of resistance that the common terms different from what we have to call things in the manifest.  Not sure what we can do about it, but it makes our spec harder to understand.  

<span id="id_49">**<a href="#id_49">Garth Conboy</a>:**</span> Is this an area we need to be more explicit about?  

<span id="id_50">**<a href="#id_50">Dave Cramer</a>:**</span> Everything we can do in our spec prose to help our readers understand - to express language we use IN language...  We should be really aware of as we write text here.  

<span id="id_51">**<a href="#id_51">Ivan Herman</a>:**</span> To be clear, technically speaking, if we use JSON LD, it is possible to rename those terms to our own liking by extending the wpub context file.  I must admit that if we are getting nervous about defining HTML, I get the same about redefining schema.org.  Yes we should give full power to Matt to make things more readable, but I would be very reluctant of changing schema.org terms - with ONE exception...  
… JSON LD we have `@type`, `@id`, `@value` and `@language`, and it's a very common practice in JSON LD, that `@typ`e is redefined to use `type`, and `@id` is redefined as `id`.  It's so common that schema.org does it.  This will make things easier to port into a javascript structure to simplify the keywords.  

<span id="id_52">**<a href="#id_52">Matt</a>:**</span> We touched on that this is something we can improve in our spec language.  This is the push and pull of using property tech names and natural language.  Our section right now is structured to concepts rather than specific naming.  We can flip it around, put property names with the language, and there's ways of tweaking, but i'm comfortable migrating us away from schema.org.  There are 'read-by' for narrator, and we should strike up a convo with[CUT]  
…  that's probably the most appropriate way to go...  

<span id="id_53">**<a href="#id_53">Dave</a>:**</span> I wanted to agree with Ivan - yes, I think in the JSON LD context, the cure is worse than the disease.  

<span id="id_54">**<a href="#id_54">Garth Conboy</a>:**</span> Much like Ivan said, we need to use the schema.org terms, but we want to be careful in our drafting that we don't lose the drafting, like the first entry, we live with what we have but we try to be as clear in our language as possible to avoid confusion.  

<span id="id_55">**<a href="#id_55">Ivan Herman</a>:**</span> we need a resolution on to change, so I moved agreeing on the removal of '@'  

> **Proposed resolution: remove the '@' from keywords; leave other terms as they are** *(Ivan Herman)*
{: .proposed_resolution}

> *Ivan Herman:* +1

> *Joshua Pyle:* +1

> *Nick Ruffilo:* +1

> *Matt Garrish:* +1

> *Jeff Buehler:* +1

> *Garth Conboy:* +1

> *Ben Walters:* +1

> *Dave Cramer:* +1

> ***Resolution #3: remove the '@' from keywords; leave other terms as they are***
{: #resolution3 .resolution}

> *Ric Wright:* +1

> *Marisa DeMeglio:* +1

### 4. TPAC Agenda
{: #section4}

> *Garth Conboy:* [https://docs.google.com/document/d/1Mt9PTcOdmrCwIsgfxbGMGjwHlUsySU01I0D4oBkSbcA/edit](https://docs.google.com/document/d/1Mt9PTcOdmrCwIsgfxbGMGjwHlUsySU01I0D4oBkSbcA/edit)

<span id="id_56">**<a href="#id_56">Garth Conboy</a>:**</span> above pasted is the draft of the TPAC agenda.  There is an agenda item requests.  A fair number are crossed off, which means they were moved into monday/tuesday...  
…  we will spend more time moving topics down, and some will move around as we co-ordinate with external groups and visitors.  We are getting really close to TPAC now, so if there are particular issues we should address in public, please add a comment in here. Please comment and add.  

### 5. incubation
{: #section5}

> *Garth Conboy:* [https://discourse.wicg.io/search?q=dpub](https://discourse.wicg.io/search?q=dpub)

<span id="id_57">**<a href="#id_57">Garth Conboy</a>:**</span> Lastly there was an Agenda item that Tzviya wanted mentioned, we do have a process in the W3C for incubation of ideas.  We have had things that are outside of the immediate scope of this group - one is the publishing object model - there is an opportunity to use the process for potential incubation.  We certainly encourage people to participate in that process.  

> *Garth Conboy:* From Agenda: “We have people in the group who are working on things that would be potentially interesting for the future state of publishing, but the current W3C assumes a formal incubation period. We need to do that in our group as well. We already have a dedicated label in WICG, so we recommend incubation of ideas like the Publishing Object Model and transclusion via iframes there [9.6]. We hope to see projects and demos at TPAC.”

<span id="id_58">**<a href="#id_58">Ivan Herman</a>:**</span> There has been lots of discussion in the group about how to discuss ideas that go beyond the group.  Such as new ways of handling CSS or HTML - possibly extending those with new features.  Even if those require a much longer work and co-operation with other groups, it would be a pity if those were lost.  We were looking for some sort of way for these incubation ideas to be recorded and documented.  Thats what we were wondering about.  

<span id="id_59">**<a href="#id_59">Garth Conboy</a>:**</span> We'll discuss more next week.  We are a tad over time, but we'll have an agenda for next week, and please comment on TPAC agenda.  Thank you and bye  

---


### 6. Resolutions
{: #res}

* [Resolution #1](#resolution1): Last meeting's minutes approved
* [Resolution #2](#resolution2): the entries in the DOC-TOC table of contents SHOULD point into the bounds of the publication
* [Resolution #3](#resolution3): remove the '@' from keywords; leave other terms as they are