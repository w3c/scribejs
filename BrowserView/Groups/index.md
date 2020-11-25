# Group specific setups

`scribejs` configuration files, as well as browser views, are set up and free to use. Other working groups are welcome to add their own configurations into this directory. This list also includes configuration for the separate [scribejs post-processing utility](https://github.com/iherman/scribejs-postprocessing/);

Current groups:

* [EPUB 3 Working Group](https://www.w3.org//publishing/groups/epub-wg/):
    * Configurations for minute generation:
      * Working Groups Calls:
        * "Group ID" to be used on command line: `epub`
        * [HTML file with client side processing](./browserview/epub.html)
        * [configuration file](./config/epub.json)
      * Accessibility Task force:
        * "Group ID" to be used on command line: `epub-a11y`
        * [HTML file with client side processing](./browserview/epub-a11y.html)
        * [configuration file](./config/epub-a11y.json)
    * Options for post-processing
      * "Group ID" to be used on command line: `epub`
      * [configuration file](./postprocessing/epub.json)
* [DID Working Group](https://www.w3.org/2019/did-wg/)
    * Configurations for minute generation:
      * Working Groups Calls:
        * "Group ID" to be used on command line: `did`
        * [HTML file with client side processing](./browserview/did.html)
        * [configuration file](./config/did.json)
      * Topical Calls:
        * "Group ID" to be used on command line: `did-topic`
        * [HTML file with client side processing](./browserview/did-topic.html)
        * [configuration file](./config/did-topic.json)
    * Options for post-processing
      * "Group ID" to be used on command line: `epub`
      * [configuration file](./postprocessing/epub.json)
* [Audiobook (formerly Publishing) Working Group](https://www.w3.org/publishing/groups/publ-wg/)
    * Working Groups Calls:
      * [HTML file with client side processing](./browserview/pwg.html)
      * [configuration file](./config/pwg.json)
* [JSON-LD) Working Group](https://www.w3.org/2018/json-ld-wg/)
    * Working Groups Calls:
      * [HTML file with client side processing](./browserview/json-ld.html)
      * [configuration file](./config/json-ld.json)

New configurations can be uploaded to this folder; when doing so, the naming scheme should be kept. Files (configurations, client side processing, etc.) are named using the IRC channels they rely on.
