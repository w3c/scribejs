# Group specific setups

`scribejs` configuration files, as well as browser views, are set up and free to use. Other working groups are welcome to add their own configurations into this directory. The configuration files are actually a combination of information needed by `scribejs`, as well as the configuration data used by separate utilities, like the separate [scribejs post-processing utility](https://github.com/iherman/scribejs-postprocessing/);

Current groups:

* [EPUB 3 Working Group](https://www.w3.org//publishing/groups/epub-wg/):
    * The [configuration file](./configurations/epub.json) contains entries for the following extra calls: `epub-a11y`, `epub-fxl`, and `epub-locators` for the Accessibility, Fixed Layout Accessibility, and Locators Task Forces, respectively.
    * [HTML file with client side processing for the core WG call](./browserview/epub.html) can also be used
    * [HTML file with client side processing for the accessibility task force](./browserview/epub-a11y.html) can also be used
* [DID Working Group](https://www.w3.org/2019/did-wg/):
    * The [configuration file](./configurations/did.json) contains entries for the following extra calls: `epub-topic` for the “Topical Calls” (as they are referred to in the Working Group).
    * The [HTML file with client side processing for the core WG call](./browserview/did.html) can also be used
    * The [HTML file with client side processing for the topical calls](./browserview/did-topic.html) can also be used
* [Audiobook (formerly Publishing) Working Group](https://www.w3.org/publishing/groups/publ-wg/)
    * The [configuration file](./configurations/pwg.json) only contains the basic setup.
    * The [HTML file with client side processing for the core WG call](./browserview/pwg.html) can also be used
* [JSON-LD) Working Group](https://www.w3.org/2018/json-ld-wg/)
    * The [configuration file](./configurations/json-ld.json) only contains the basic setup.
    * The [HTML file with client side processing for the core WG call](./browserview/json-ld.html) can also be used


New configurations can be uploaded to this folder; when doing so, the naming scheme should be kept. Files (configurations, client side processing, etc.) are named using the IRC channels they rely on.
