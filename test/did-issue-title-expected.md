---
layout: minutes
date: 2021-05-04
title: DID WG Telco — 2021-05-04
json-ld: |
    {
        "@context": [
            "https://schema.org",
            {
                "resolution": {
                    "@id": "https://w3c.github.io/scribejs/vocab/resolution",
                    "@context": {
                        "@vocab": "https://w3c.github.io/scribejs/vocab/"
                    }
                },
                "irc": {
                    "@id": "https://w3c.github.io/scribejs/vocab/irc"
                }
            }
        ],
        "@type": "CreativeWork",
        "url": "https://www.w3.org/2019/did-wg/Meetings/Minutes/2021-05-04-did",
        "name": "DID WG Telco — Minutes",
        "about": "DID WG Telco",
        "dateCreated": "2021-05-04",
        "irc": "did",
        "datePublished": "2021-05-06",
        "genre": "Meeting Minutes",
        "accessMode": "textual",
        "accessModeSufficient": "textual",
        "encodingFormat": "text/html",
        "publisher": {
            "@type": "Organization",
            "name": "World Wide Web Consortium",
            "url": "https://www.w3.org/"
        },
        "inLanguage": "en-US",
        "recordedAt": {
            "@type": "Event",
            "name": "DID WG Telco",
            "startDate": "2021-05-04",
            "endDate": "2021-05-04",
            "location": {
                "@type": "VirtualLocation",
                "description": "Teleconference"
            },
            "attendee": [
                {
                    "@type": "OrganizationRole",
                    "roleName": "chair",
                    "attendee": [
                        {
                            "@type": "Person",
                            "name": "Brent Zundel"
                        }
                    ]
                },
                {
                    "@type": "OrganizationRole",
                    "roleName": "scribe",
                    "attendee": [
                        {
                            "@type": "Person",
                            "name": "Charles Lehner"
                        }
                    ]
                },
                {
                    "@type": "Person",
                    "name": "Ivan Herman"
                },
                {
                    "@type": "Person",
                    "name": "Manu Sporny"
                },
                {
                    "@type": "Person",
                    "name": "Shigeya Suzuki"
                },
                {
                    "@type": "Person",
                    "name": "Justin Richer"
                },
                {
                    "@type": "Person",
                    "name": "Chris Winczewski"
                },
                {
                    "@type": "Person",
                    "name": "Amy Guy"
                },
                {
                    "@type": "Person",
                    "name": "Geun-Hyung"
                },
                {
                    "@type": "Person",
                    "name": "Ted Thibodeau Jr."
                },
                {
                    "@type": "Person",
                    "name": "Drummond Reed"
                },
                {
                    "@type": "Person",
                    "name": "Daniel Burnett"
                }
            ]
        }
    }

---

# DID WG Telco — Minutes
{: .no_toc .draft_notice_needed}



**Date:** 2021-05-04

See also the [Agenda](https://lists.w3.org/Archives/Public/public-did-wg/2021Apr/0040.html) and the [IRC Log](https://www.w3.org/2021/05/04-did-irc.txt)

## Attendees
{: .no_toc}
**Present:** Ivan Herman, Manu Sporny, Brent Zundel, Shigeya Suzuki, Charles Lehner, Justin Richer, Chris Winczewski, Amy Guy, Geun-Hyung, Ted Thibodeau Jr., Drummond Reed, Daniel Burnett

**Regrets:** 

**Guests:** 

**Chair:** Brent Zundel

**Scribe(s):** Charles Lehner

## Content:
{: .no_toc}

* TOC
{:toc}
---


> *Geun-Hyung:* Geun-Hyung has joined #did

### 1. bla
{: #section1}

_See github issue [did-test-suite#28](https://github.com/w3c/did-test-suite/issues/28)._

<!-- issue w3c/did-test-suite/28 -->



**Brent Zundel:** Chair things.  
… On the 13th of April, the chairs set a deadline for tests to be written.  
… for the end of April - and stated at that time that any normative statements that were untestable because no tests were written, would have to be removed from the specification.  
… What this means for group is need to decide what to do with the CBOR section.  
… Issue where CBOR production/consumption rules discussed [at a meeting in April](https://www.w3.org/2019/did-wg/Meetings/Minutes/2021-04-13-did#section4)  
… It is clear from those comments that the concerned parties were aware of the need for tests to be written. There was also a [special topic call on the 8th of April](https://www.w3.org/2019/did-wg/Meetings/Minutes/2021-04-08-did-topic)  
… that focused primarily on the CBOR section and how to test it, with concerned parties.  
… I outline all of this to make very clear that communication has been clear, and that all efforts have been made, as chairs and editorial staff, to encourage the writing of these tests.  

### 2. Pull Requests https://github.com/w3c/did-core/pulls
{: #section2}

**Brent Zundel:** Is there an editor who would like to run through the PRs. or the chairs to do it?  

#### 2.1. Updating figure 2 to include example values 
{: #section2-1}

_See github pull request [#727](https://github.com/w3c/did-core/pull/727)._

<!-- issue w3c/did-core/727 -->



**Manu Sporny:** PR: simple update to the diagram that shigeya is doing on behalf of someone else who did a full review of the spec.  
… Their review came back with nothing really wrong.  
… PR is editorial. If you have opinion on the diagram label, please take a look.  

### 3. DID Core issues
{: #section3}

> *Brent Zundel:* [https://github.com/w3c/did-core/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc+-label%3Adefer-v2](https://github.com/w3c/did-core/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc+-label%3Adefer-v2)

**Brent Zundel:** 11 open issues.  

#### 3.1. Proving Control sections are wrong 
{: #section3-1}

_See github issue [#583](https://github.com/w3c/did-core/issues/583)._

<!-- issue w3c/did-core/583 -->



**Brent Zundel:** There has been a bit of conversation. Need a PR to fix issue.  

**Manu Sporny:** General statement: I triaged issue this past weekend, marked everything that was a CR comment. Marked anything ready for a PR as ready for PR.  
… Almost every one except 2 or 3 are ready for PR.  

#### 3.2. Support of `publicKeyMultibase` 
{: #section3-2}

_See github issue [#707](https://github.com/w3c/did-core/issues/707)._

<!-- issue w3c/did-core/707 -->



**Brent Zundel:** I know that some changes have come in as a result of this. What more needs to happen?  

> *Manu Sporny:* See [comment on the things to do](https://github.com/w3c/did-core/issues/707#issuecomment-826382717)

**Manu Sporny:** I proposed for the `publicKeyMultibase` stuff a path forward in this link  
… It looks like folks want to use `publicKeyMultibase` instead of `publicKeyBase58`. We do have an at-risk marker that this may be done.  
… One thing could do: update examples. Already have in did-spec-registries, but could add note.  
… Add to registries, update material in spec.  
… Not normative.  
… I believe it does.  
… It has instructions. If you are an implementor, this is how to submit your implementations. ... It should be straightforward and easy.  
… Others have done it, without the instructions.  

**Daniel Burnett:** It's short... The hope is that anyone who is aware of the work should be able to follow and understand this.  
… The chairs will take that as an action.  

**Brent Zundel:** Thank you everyone.  

---


