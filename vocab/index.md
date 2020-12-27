# Vocabulary for scribejs

This is the (minimal) namespace document for predicates defined for, and used by, the metadata added to the minutes. That metadata is embedded as JSON-LD in the generated minutes, and is, mostly, relying on [schema.org](https://schema.org) terms, but needs some extra terms that are defined specifically for scribjes (and have no counterpart in schema.org). These are:

* `https://w3c.github.io/scribjes/vocab/Resolution`: a type identifying an object describing a resolution of a meeting, and recorded in the minutes as such.
* `https://w3c.github.io/scribejs/vocab/resolution`: a property referring to a resolution object; domain is `https://schema.org/CreativeWork`, range is `https://w3c.github.io/scribjes/vocab/Resolution`.
* `https://w3c.github.io/scribejs/vocab/resolution_number`: a property referring to the number identifier of a resolution object; domain is `https://w3c.github.io/scribjes/vocab/Resolution`, range is an integer literal.
* `https://w3c.github.io/scribejs/vocab/resolution_text`: a property referring to the text of the resolution; domain is `https://w3c.github.io/scribjes/vocab/Resolution`, range is a (string) literal.
