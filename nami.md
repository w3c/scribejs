![W3C Logo](https://www.w3.org/Icons/w3c_home)
# Meeting: Digital Publishing Interest Group Teleconference
**Date:** 27 February 2017

See also the [Agenda]($headers.agenda) and the [IRC Log](test/dpub-test.txt)
## Attendees
**Present:** RIck_Johnson, Leonard, Avneesh, ivan, dauwhe, Karen, laudrain, rdeltour, Bill_Kasdorf, Chris_Maden, Peter Krautzberger, Vlad, Bert, Charles, astearns, Deborah_Kaplan, duga, david_stroup, Jonathan, Nick_Brown, BillMcCoy, Garth, Benjamin_Young

**Regrets:** Nick

**Guests:** 

**Chair:** Garth

**Scribe(s):** Karen
## Content:
* [1. New participants](#section1)
* [2. Publishing Business Group update](#section2)
* [3. remaining Technical Issues](#section3)
    * [3.1. Manifests](#section4)
* [4. Publishing Practicalities on Charter](#section5)
    * [4.1. A11 Task Force input](#section6)
* [5. Section 3.2 in the charter (API-s)](#section7)
* [6. F2F meeting](#section8)

---


> *ivan*: ivan has changed the topic to: agenda for 2017-02-27: https://lists.w3.org/Archives/Public/public-digipub-ig/2017Feb/0044.html

> *pkra*: *hides in the shadows*

**GarthConboy:** we look to have a critical mass
 Last Monday was a holiday in the states, so maybe that helped Minutes are in the agenda they looked ok to me any objections to minute approval? Silence being consent, let's note that they minutes are approved

### [1. New participants](id:section1)

**GarthConboy:** Looking at irc, I'll call out some of the new-comers we are expecting
 Jonathan Hevenstone from Atypon/Wiley membership hope he is here and will be contributing shortly and Nick Brown from Ingram

**Nick:** yes, I am here


**GarthConboy:** want to give us a brief introduction


**Nick:** I work with Ingram, specifically Vital Source
 work on our ereader applications we are huge proponents of EPUB work closely with Rick Johnson whom you know

**GarthConboy:** welcome aboard
 And @ with Pearson she joined and sent regrets his company Atypon was acquired by Wiley

**Jonathan:** I just joined
 is there a question about the involvement we will have?

**GarthConboy:** you don't have to divulge secrets; just give us an introduction about you


**Jonathan:** I was involved in IDPF when we were developing the first EPUB spec
 working with Publishing Dementions, later acquired by Jouve Atypon is a tech company acquired by Wiley in October we host about 30 percent of world's journal articles in terms of current front list and will grow to 40 percent with Wiley online hosting, content development and monetization Some publishers have EPUB to download we don't provide solutions for viewing them we are launching a new in-browser, Readium based reader, to deliver journal articles in that format address light-way copyright and annotation

**GarthConboy:** Welcome back into the fold


**Jonathan:** thanks, this is fun


**GarthConboy:** I'll give Carley from Pearson a chance to say high; but she sent regrets


### [2. Publishing Business Group update](id:section2)

**GarthConboy:** I believe Bill McCoy is on the call to give us an update on the PBG


**BillMcCoy:** The Publishing Business Group is formed


> *dauwhe*: https://www.w3.org/community/publishingbg/

**BillMcCoy:** if you are not sure if your org is eligible, just clicked the join link and we'll address it manually
 First Publishing BG meeting is 10:30am-2:30pm London time there is a list, but people are still arriving we have a special TPI program for eligible IDPF members we should start having email exchanges on the Publishing BG shortly the steering committee is active, which is the former IDPF board members ultimately the PBG will elect the steering committee Agenda is there Expect discussions about charter will take place on GitHub

> *ivan*: details on the meeting in London: https://www.w3.org/wiki/PublishingBG/meeting/2017-03-13#March_13.2C_2017_Kick-Off_Meeting

**BillMcCoy:** there will be people in Publishing BG who are not part of this group, mainly for historical reasons
 to be as inclusive as possible, would be good if the charter discussions happened in GitHub Do you want more details?

**GarthConboy:** any input as to how the Business Group
 which is expected to provide input to the charter of the WG how that process will go, and timing thereof?

**BillMcCoy:** Chartering of a WG at W3C has many steps, unlike the CG and BGs
 a WG has a number of more steps, including consent of all the W3C members we want to get that done as soon as possible, but we want to be inclusive to the whole publishing community a balancing act this group is ready to move on with the strawman draft charter there seems to be significant consensus but key factor is to get broader feedback from the community that has not been here for the past two years have the charter be attractive to the broader industry I don't think it will be that long this group has done an excellent job I hope the BG can get to a 'looks good to us' I'm an optimist hope we can get to this step quickly and get a new WG in place this spring, which is what I think everyone wants to happen

**Leonard:** Bill, do have any thoughts on how you see conflicts?
 you'd like to hope no bumps in the road but on off chance there is a conflict between BG and those who have been working already towards this effort, do you have a feeling on how those would be resolved?

**BillMcCoy:** we have chairs, self-nominated from among the steering committee
 those co-chairs are Paul Belfanti, Rick Johnson and Cristina Mussinelli so not a question of which group or one of people seeing it for the first time next week different perspectives from those who have been working on it v those who just arrived as you know, the draft charter has been sent to the W3C Advisory Committee we want to broaden the perspective process of consensus is magical but I'm confident for Paul, Rick, Cristina, GarthConboy and Tzviya working with Ivan and me I hope we get better than rough consensus, but will be pleasantly surprised if we do

**GarthConboy:** I'm even more of an optimist and will second that
 if no more commentary on business group or process stuff

**Dave:** We had some earlier details about 11:30- 2:30
 wiki says 11:30-2:30

**Karen:** the wiki is correct


> *Bill_Kasdorf*: Karen, I think you mis-typed above, it says the wiki says 11:30

**GarthConboy:** yes, 10:30am start


**Bill:** hope everyone can attend


### [3. remaining Technical Issues](id:section3)

> *BillMcCoy*: publishing business group home page: https://www.w3.org/community/publishingbg/

**GarthConboy:** wold be good to publish a less drafty charter
 last week we had two action items jointly on Leonard and David's plate online offline and manifest chit chat on mailing list this morning David's comment

> *BillMcCoy*: march 13 kickoff meeting agenda: https://www.w3.org/wiki/PublishingBG/meeting/2017-03-13#March_13.2C_2017_Kick-Off_Meeting

**GarthConboy:** pull link to draft charter under section 2
 bullet 4 and 5 the one talking about offline, second one talking about manifest I saw the email from David, and will be quiet and not propose language the current text in the draft charter

> *ivan*: current github issue on online/offline: https://github.com/w3c/dpub-pwp/issues/41

**GarthConboy:** says [reads]
 email from Dave this morning was let's stay the course and leave that alone I don't think that is in the camp Leonard is in

> *BillMcCoy*: side note that W3C is co-sponsoring the EPUB Summit Europe 2017 on march 8-9 in Brussels still time to register see https://www.edrlab.org/epub-summit-2017/

**GarthConboy:** not sure if you have synched on this, proposed language


**Ivan:** I see question update on irc
 at this moment if we can set a priority of the @draft I think we have to be in a position of publishing that as well as the ucr asap to make it a better document input to the charter process that is my priority taking into account all things Bill explained I am uneasy to touch the charter until the business group is up and running I would be uneasy to change things significantly on the charter

**GarthConboy:** maybe an ignorant comment
 I thought the online/offline had been agreed to in the PWP document; is that untrue?

**Ivan:** It's untrue
 we had a discussion two weeks ago; nothing has changed in PWP document

**GarthConboy:** I thought it was totally on the charter?
 and not the PWP document

**Ivan:** It started with some questions that Leonard asked about the PWP document


**Leonard:** it has gone back and forth
 some stuff copied one from the other document but it's not in synch I thought we were going to agree on language in charter and back it into PWP doc; but I don't care which way we go

**Ivan:** I thought it was the opposite; get the PWP text right and then moving that to the charter
 but I think it can lead to non-technical issues

**Leonard:** I would rather have the charter text better so that the BG is reading something this group is happy with


**GarthConboy:** I think there is some possibility
 'that this looks good to us' from business group charter is more consumable than PWP and will get more consumption for that reason perhaps I neglected to ask you Leonard, is there language on the charter language that you and Dave agree upon?

**Leonard:** that was fine for me; I can completely live with what is there today


**GarthConboy:** that sounds like a halleluia
 I read and that is what it says so if Leonard and Dave are happy then let's go with what we have there, and maybe we can declare victory and I believe Dave is correct that we do match between charter and PWP don't want to be quiet for any further disagreement Let's note we have reached resolution in online and offline documents That brings us to the manifest discussion

#### [3.1. Manifests](id:section4)

**GarthConboy:** the other one that Dave and Leonard were going to synch on
 again, let me read a few sentences from the draft charter [reads] there was discussion two weeks ago about @ and presentation or trim that paragraph ever so slightly any input

**Dave:** I apologize for not reaching out to Leonard to work on that language


> *Leonard*: Mea culpa from me too...

**GarthConboy:** happy to open up for some discussion now
 on that my two cents worth is whether manifest is "M" or "m" as loose term needs to be something about sequence somewhere one can argue about sequence and presentation I believe that was Leonard's proposal to drop sequence and presentation I expect we'll dig into that when we have the WG going

**Leonard:** my issue remains
 we can talk about sequence and presentation in the context of metadata and manifest but constituent resources implies images and fonts and data that have nothing to do with sequence and presentation I would put a period after presentation and end after sequence and presentation…full stop

**Dave:** I'm fine with that, too
 manifest will need various information besides raw accounting of constituent resources

**Leonard:** Let me write something in irc


> *BillMcCoy*: I just recommend that we do this all via github issues not via this meeting

**GarthConboy:** I propose we take a 25 second break for that post to come in


> *BillMcCoy*: take it now and put it in as a github issue??

**GarthConboy:** Appreciate Bill's comment, but I want to take it now
 and get it back into the draft

> *Leonard*: "The metadata and manifest will also incorporate information about the sequence and presentation of the content"

**GarthConboy:** ok, Bill


> *BillMcCoy*: so that draft changes come via github issues...

**Leonard:** take as is, or word smith ok


**Ivan:** Make it clear that this includes the fact that
 resource of publication [full stop] and then your phrase

**Leonard:** yes, that was implied


**GarthConboy:** That looks fine to me


> *Bill_Kasdorf*: +1

**GarthConboy:** This is great


### [4. Publishing Practicalities on Charter](id:section5)

**GarthConboy:** Let's get that change into the charter
 and then we have both offline and Leonard or Ivan, who wants to do the charter change?

**Ivan:** I will do this change on the charter tomorrow morning my time
 and some minor organizational things and I'll check if same language is used on draft make sure they are both in synch eager to see these be as mature as possible

**GarthConboy:** Great
 if we can not re-open the online/offline and manifest discussions until we get to charter review or the real WG

#### [4.1. A11 Task Force input](id:section6)

**GarthConboy:** Do we have an update from the Accessibility TF from the recharter update?


**Avneesh:** Yes, so we have defined the task further; it was posted to the mailing list
 we have not received all responses but we have received some and it looks like it is moving towards resolution some people traveling to CSUN may be why responses are slow

**GarthConboy:** You would get consensus in the TF and then propose language to the larger group?


**Avneesh:** yes, that is the plan


**George:** Avneesh and I have agreed on what we think is the right language
 Charles, Deborah, others, happy to have you chime in but want to make sure others have a chance to look at it

**GarthConboy:** If that can be driven forward in next couple of days, and then put on agenda for a week from today
 or let us know we don't have to talk about; or as agenda, that would be awesome

**Deborah:** that should be fine
 conversations on email list this morning should not be a problem just have to make things shorter

**GarthConboy:** Short is always good
 Ivan, I was going to ask him to talk logistics about getting these docs public

**Ivan:** essentially yes
 the changes we discussed earlier reflect consensus so I will put into the main branch tomorrow morning

> *Leonard*: +1

**Ivan:** but I would like to put the Accessibility into a separate pull request
 and not put that directly into the main branch put into a separate branch The other question is that the discussion we are having for the Accessibility is really relevant for the draft I think the draft is ok we are word smithing here to be appropriate, but not really appropriate for the draft shall I talk about practicalities?

**GarthConboy:** Next agenda item is next steps, so yes, Ivan


**Ivan:** the charter we have discussed it will be there
 at this moment I know there are two open issues in the issue list which I propose this group not get into too much they are much more business rather than technical questions Bill McCoy can tell me if I am right or not one issue is around the exact position of WP v EPUB 4 what do we mean by backward compatibility which I expect will be a larger discussion with BG and AC we should not touch that right now Other comment that came up comments on issue of DRM I welcome you to look at the few issues there again, I think this is more up the alley of the BG am I right, Bill?

**Bill:** not sure what the engagement will be, but I do agree the BG is the right place for the discussion
 since we don't have the BG rolling, it's more hypothetical I don't disagree with you

**GarthConboy:** maybe I'm taking more happy pills than Bill on EPUB4 backward compatability
 it has somewhat petered out maybe we are close to a resolution on that

**Ivan:** I am less optimistic
 I think everyone is waiting one of people who started the discussion is Daniel Glazman, who realizes where this conversation will take place

**GarthConboy:** we shall see
 Daniel is not shy about disagreeing with me

**Ivan:** agreed


**GarthConboy:** Who else...


**Ivan:** I will go on with the other documents
 let's get Dave

**Dave:** Another question about the scope of the EPUB3 CG
 what branch will be acceptable

**Ivan:** to come back to the other two documents
 those two are ready to be published as drafts we had short discussion about whether they should be drafts or notes Dave said should not be a note I am lukewarm on both sides, just important to have them be published I will go through the documents, mainly editorially Respect comes up with a few things I will get both docs into a format that can be published right away and we should have a resolution to publihs and then I take care of it with the W3C web master

**GarthConboy:** Dave?
 Leonard, go ahead

### [5. Section 3.2 in the charter (API-s)](id:section7)

**Leonard:** I will add to tracker; but we have not discussed 3.2
 whether we leave them in the initial charter or not under potential rec track deliverables someone has a comment on whether we go down that path at all

**ivan:** the someone is me


**Leonard:** we don't want charter to go out with that editorial note; so do we leave or remove 3.2


**GarthConboy:** my proposal that this is biting off more than we want to in this group, so we should remove, but open to other opinions


**Leonard:** I agree with you


> *Rick_Johnson*: +1 to remove for now

**Leonard:** we can always add work


**Ivan:** point is we cannot add to group just like that
 what we put into charter later requires rechartering at the moment the text stays the following deliverables may be...[reads] the goal was, it leaves the door open but makes it dependent on some incubation coming in with that, I would propose leaving it in it may not fly with W3M or whomever but at this moment I would be uneasy to take it out getting it in again may be much more difficult

**Leonard:** I would say the other way around
 well, if we take it out, we can do that work elsewhere not every piece of publications work has to be in a single WG we are in agreement on the main points if someone actually came with an incubation or proposal, let's start another WG they are not core to our goals; let them happen somewhere else

**Ivan:** In general, I would agree with you
 the problem is that the current set-up with IDPF members is that they can only join one WG

**Leonard:** But these things are completely new things, never discussed by the IDPF


**Ivan:** that is true; is it outside the interest?


> *Garth*: a?

**Leonard:** maybe but they should become involved and join as full members


**Dave:** seems to be some fragmentation
 to spin up new groups for them not have 70 different CSS WGs for example

**BillMcCoy:** This would be a great thing to discuss with the new PBG
 at end of the day we have to have an achievable WG charter but would not be terrible if scope is bigger than what is accomplished I can see both sides but I don't want to see a parallel working group for things that should be part of Publishing@W3C the spirit of the commitment is to participate in Publishing@W3C things and understood that it would be more than was at IDPF not fully in agreement with Leonard, but I am also not insisting that things in 3.2 stay will be logical sorry for mushy answer

**GarthConboy:** I am in a similar mushy place
 no way we can get to PWP mission if the text is here, we may do this, I don't have a lot of religion one way or another whether we get too dinged as being too wishy-washy for charter or if concern of BG

**Rick:** mostly an observer to this
 I had said +1 in the thread and wanted to explain my thoughts we feel like we want to talk about this and if we keep it as a placeholder, it makes it easier to talk about it I think we are talking a bit in circles there if after we form, and we want to talk about, that is the level for discussion for the charter let's not confuse it by having a place there now

**GarthConboy:** so your plus one is to remove for now


**Rick:** yes, remove for now, and if we want to talk about it, bring about it through harder process and talk about it afterward


**George:** I have my hand up
 if this is not in the charter and we want to move it into the discussion, is that all 'legal' in W3C?

**Ivan:** That is what I was saying, can be done later but only if we re-charter


**GarthConboy:** is that true if we define these APIs as part of WP, does charter limit us?


**Ivan:** I think that would be pushing it
 I think we would be forced to make a new charter or recharter or create a new WG think about fact that we are talking about IPR commitments not seeing charter without those IPR commitments would not think about APIs, except for company like Google that has a lot of APIs

**GarthConboy:** I cede to your wisdom


**BillMcCoy:** Maybe a more general statement about APIs
 currently sounds like we have concrete plans for two APIs maybe a more general statement without stating clearly what we want to do

**GarthConboy:** I have little religion on this
 but want to get to another topic shortly

**Ivan:** I don't think what Bill is saying will fly


> *BillMcCoy*: I defer to Ivan on what will fly w/ AC

**Ivan:** knowing how AC is working these days
 we refer to the PWP draft; gives some sort of technical background which is now leading to the charter that PWP draft has nothing about APIs I am a little afraid it will not fly Listening to the reactions I am fine if we decide to take it out I am a little worried if there is really a need Maybe what Rick said, if there is really a need, then a rechartering of the group may be a good thing to do it would draw attention of other companies and participants to specific work maybe that is a good thing to do I am not bound to keeping it

**GarthConboy:** I am personally happy taking it out under that wisdom
 i don't see us wanting to think about it impacting our work on WP and the P portion thereof are there others on the call who disagree with taking it out for now with any verve? Let's count that as consensus and remove 3.2 for now Lastly ack Ivan

> *BillMcCoy*: again I recommend removing it via github issue so the edit history is clear to both AC reps who've received advance notice and new PBG members

### [6. F2F meeting](id:section8)

**GarthConboy:** last on the agenda
 proposed F2F for this group in NYC following BEA not too many people want to participate in the F2F realistically the same folks from BEA and not stay over the weekend Friday/Saturday is equally problematic for our Jewish contingent result from poll thus far and encourage others to fill out we have ten in person and five remote interested Tzviya seems to be willing to attend i think we should stay the course with this schedule but encourage other people to flesh it out Ivan and I will be on an agenda planning call next week Let's get together this following Monday

**George:** the 5th and 6th?


**GarthConboy:** yes
 let's talk again next Monday