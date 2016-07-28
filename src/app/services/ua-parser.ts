import {Injectable} from "@angular/core";

@Injectable()
export class UAParser {

	LIBVERSION = '0.7.10';
	EMPTY = '';
	UNKNOWN = '?';
	FUNC_TYPE = 'function';
	UNDEF_TYPE = 'undefined';
	OBJ_TYPE = 'object';
	STR_TYPE = 'string';
	MAJOR = 'major'; // deprecated
	MODEL = 'model';
	NAME = 'name';
	TYPE = 'type';
	VENDOR = 'vendor';
	VERSION = 'version';
	ARCHITECTURE = 'architecture';
	CONSOLE = 'console';
	MOBILE = 'mobile';
	TABLET = 'tablet';
	SMARTTV = 'smarttv';
	WEARABLE = 'wearable';
	EMBEDDED = 'embedded';

	BROWSER:{};
	CPU:{};
	DEVICE:{};
	ENGINE:{};
	OS:{};

	getBrowser;
	getCPU;
	getDevice;
	getEngine;
	getOS;
	getResult;
	getUA;
	setUA;

	///////////
	// Helper
	//////////

	private util = {
		extend: function (regexes, extensions) {
			for (var i in extensions) {
				if ("browser cpu device engine os".indexOf(i) !== -1 && extensions[i].length % 2 === 0) {
					regexes[i] = extensions[i].concat(regexes[i]);
				}
			}
			return regexes;
		},
		has: function (str1, str2) {
			if (typeof str1 === "string") {
				return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
			} else {
				return false;
			}
		},
		lowerize: function (str) {
			return str.toLowerCase();
		},
		major: function (version) {
			return typeof(version) === this.STR_TYPE ? version.split(".")[0] : undefined;
		}
	};


	///////////////
	// Map helper
	//////////////


	private mapper = {

		rgx: function () {

			let result, i = 0, j, k, p, q, matches, match, args = arguments;

			// loop through all regexes maps
			while (i < args.length && !matches) {

				let regex = args[i],       // even sequence (0,2,4,..)
					props = args[i + 1];   // odd sequence (1,3,5,..)

				// construct object barebones
				if (typeof result === this.UNDEF_TYPE) {
					result = {};
					for (p in props) {
						if (props.hasOwnProperty(p)) {
							q = props[p];
							if (typeof q === this.OBJ_TYPE) {
								result[q[0]] = undefined;
							} else {
								result[q] = undefined;
							}
						}
					}
				}

				// try matching uastring with regexes
				j = k = 0;
				while (j < regex.length && !matches) {
					matches = regex[j++].exec(this.getUA());
					if (!!matches) {
						for (p = 0; p < props.length; p++) {
							match = matches[++k];
							q = props[p];
							// check if given property is actually array
							if (typeof q === this.OBJ_TYPE && q.length > 0) {
								if (q.length == 2) {
									if (typeof q[1] == this.FUNC_TYPE) {
										// assign modified match
										result[q[0]] = q[1].call(this, match);
									} else {
										// assign given value, ignore regex match
										result[q[0]] = q[1];
									}
								} else if (q.length == 3) {
									// check whether function or regex
									if (typeof q[1] === this.FUNC_TYPE && !(q[1].exec && q[1].test)) {
										// call function (usually string mapper)
										result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
									} else {
										// sanitize match using given regex
										result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
									}
								} else if (q.length == 4) {
									result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
								}
							} else {
								result[q] = match ? match : undefined;
							}
						}
					}
				}
				i += 2;
			}
			return result;
		},

		str: function (str, map) {

			for (var i in map) {
				// check if array
				if (typeof map[i] === this.OBJ_TYPE && map[i].length > 0) {
					for (var j = 0; j < map[i].length; j++) {
						if (this.util.has(map[i][j], str)) {
							return (i === this.UNKNOWN) ? undefined : i;
						}
					}
				} else if (this.util.has(map[i], str)) {
					return (i === this.UNKNOWN) ? undefined : i;
				}
			}
			return str;
		}
	};


	///////////////
	// String map
	//////////////

	private maps = {

		browser: {
			oldsafari: {
				version: {
					'1.0': '/8',
					'1.2': '/1',
					'1.3': '/3',
					'2.0': '/412',
					'2.0.2': '/416',
					'2.0.3': '/417',
					'2.0.4': '/419',
					'?': '/'
				}
			}
		},

		device: {
			amazon: {
				model: {
					'Fire Phone': ['SD', 'KF']
				}
			},
			sprint: {
				model: {
					'Evo Shift 4G': '7373KT'
				},
				vendor: {
					'HTC': 'APA',
					'Sprint': 'Sprint'
				}
			}
		},

		os: {
			windows: {
				version: {
					'ME': '4.90',
					'NT 3.11': 'NT3.51',
					'NT 4.0': 'NT4.0',
					'2000': 'NT 5.0',
					'XP': ['NT 5.1', 'NT 5.2'],
					'Vista': 'NT 6.0',
					'7': 'NT 6.1',
					'8': 'NT 6.2',
					'8.1': 'NT 6.3',
					'10': ['NT 6.4', 'NT 10.0'],
					'RT': 'ARM'
				}
			}
		}
	};


	//////////////
	// Regex map
	/////////////

	private regexes = {

		browser: [[

			// Presto based
			/(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
			/(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
			/(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
			/(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80

		], [this.NAME, this.VERSION], [

			/\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
		], [[this.NAME, 'Opera'], this.VERSION], [

			// Mixed
			/(kindle)\/([\w\.]+)/i,                                             // Kindle
			/(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
			// Lunascape/Maxthon/Netfront/Jasmine/Blazer

			// Trident based
			/(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
			// Avant/IEMobile/SlimBrowser/Baidu
			/(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

			// Webkit/KHTML based
			/(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
			/(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs)\/([\w\.-]+)/i
			// Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS
		], [this.NAME, this.VERSION], [

			/(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
		], [[this.NAME, 'IE'], this.VERSION], [

			/(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
		], [this.NAME, this.VERSION], [

			/(yabrowser)\/([\w\.]+)/i                                           // Yandex
		], [[this.NAME, 'Yandex'], this.VERSION], [

			/(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
		], [[this.NAME, /_/g, ' '], this.VERSION], [

			/(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i,
			// Chrome/OmniWeb/Arora/Tizen/Nokia
			/(qqbrowser)[\/\s]?([\w\.]+)/i
			// QQBrowser
		], [this.NAME, this.VERSION], [

			/(uc\s?browser)[\/\s]?([\w\.]+)/i,
			/ucweb.+(ucbrowser)[\/\s]?([\w\.]+)/i,
			/JUC.+(ucweb)[\/\s]?([\w\.]+)/i
			// UCBrowser
		], [[this.NAME, 'UCBrowser'], this.VERSION], [

			/(dolfin)\/([\w\.]+)/i                                              // Dolphin
		], [[this.NAME, 'Dolphin'], this.VERSION], [

			/((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
		], [[this.NAME, 'Chrome'], this.VERSION], [

			/XiaoMi\/MiuiBrowser\/([\w\.]+)/i                                   // MIUI Browser
		], [this.VERSION, [this.NAME, 'MIUI Browser']], [

			/android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)/i         // Android Browser
		], [this.VERSION, [this.NAME, 'Android Browser']], [

			/FBAV\/([\w\.]+);/i                                                 // Facebook App for iOS
		], [this.VERSION, [this.NAME, 'Facebook']], [

			/fxios\/([\w\.-]+)/i                                                // Firefox for iOS
		], [this.VERSION, [this.NAME, 'Firefox']], [

			/version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
		], [this.VERSION, [this.NAME, 'Mobile Safari']], [

			/version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
		], [this.VERSION, this.NAME], [

			/webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
		], [this.NAME, [this.VERSION, this.mapper.str, this.maps.browser.oldsafari.version]], [

			/(konqueror)\/([\w\.]+)/i,                                          // Konqueror
			/(webkit|khtml)\/([\w\.]+)/i
		], [this.NAME, this.VERSION], [

			// Gecko based
			/(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
		], [[this.NAME, 'Netscape'], this.VERSION], [
			/(swiftfox)/i,                                                      // Swiftfox
			/(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
			// IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
			/(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
			// Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
			/(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

			// Other
			/(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
			// Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
			/(links)\s\(([\w\.]+)/i,                                            // Links
			/(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
			/(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
			/(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
		], [this.NAME, this.VERSION]
		],

		cpu: [[

			/(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
		], [[this.ARCHITECTURE, 'amd64']], [

			/(ia32(?=;))/i                                                      // IA32 (quicktime)
		], [[this.ARCHITECTURE, this.util.lowerize]], [

			/((?:i[346]|x)86)[;\)]/i                                            // IA32
		], [[this.ARCHITECTURE, 'ia32']], [

			// PocketPC mistakenly identified as PowerPC
			/windows\s(ce|mobile);\sppc;/i
		], [[this.ARCHITECTURE, 'arm']], [

			/((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
		], [[this.ARCHITECTURE, /ower/, '', this.util.lowerize]], [

			/(sun4\w)[;\)]/i                                                    // SPARC
		], [[this.ARCHITECTURE, 'sparc']], [

			/((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
			// IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
		], [[this.ARCHITECTURE, this.util.lowerize]]
		],

		device: [[

			/\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
		], [this.MODEL, this.VENDOR, [this.TYPE, this.TABLET]], [

			/applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
		], [this.MODEL, [this.VENDOR, 'Apple'], [this.TYPE, this.TABLET]], [

			/(apple\s{0,1}tv)/i                                                 // Apple TV
		], [[this.MODEL, 'Apple TV'], [this.VENDOR, 'Apple']], [

			/(archos)\s(gamepad2?)/i,                                           // Archos
			/(hp).+(touchpad)/i,                                                // HP TouchPad
			/(kindle)\/([\w\.]+)/i,                                             // Kindle
			/\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
			/(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
		], [this.VENDOR, this.MODEL, [this.TYPE, this.TABLET]], [

			/(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
		], [this.MODEL, [this.VENDOR, 'Amazon'], [this.TYPE, this.TABLET]], [
			/(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
		], [[this.MODEL, this.mapper.str, this.maps.device.amazon.model], [this.VENDOR, 'Amazon'], [this.TYPE, this.MOBILE]], [

			/\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
		], [this.MODEL, this.VENDOR, [this.TYPE, this.MOBILE]], [
			/\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
		], [this.MODEL, [this.VENDOR, 'Apple'], [this.TYPE, this.MOBILE]], [

			/(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
			/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|huawei|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
			// BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Huawei/Meizu/Motorola/Polytron
			/(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
			/(asus)-?(\w+)/i                                                    // Asus
		], [this.VENDOR, this.MODEL, [this.TYPE, this.MOBILE]], [
			/\(bb10;\s(\w+)/i                                                   // BlackBerry 10
		], [this.MODEL, [this.VENDOR, 'BlackBerry'], [this.TYPE, this.MOBILE]], [
			// Asus Tablets
			/android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7)/i
		], [this.MODEL, [this.VENDOR, 'Asus'], [this.TYPE, this.TABLET]], [

			/(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
			/(sony)?(?:sgp.+)\sbuild\//i
		], [[this.VENDOR, 'Sony'], [this.MODEL, 'Xperia Tablet'], [this.TYPE, this.TABLET]], [
			/(?:sony)?(?:(?:(?:c|d)\d{4})|(?:so[-l].+))\sbuild\//i
		], [[this.VENDOR, 'Sony'], [this.MODEL, 'Xperia Phone'], [this.TYPE, this.MOBILE]], [

			/\s(ouya)\s/i,                                                      // Ouya
			/(nintendo)\s([wids3u]+)/i                                          // Nintendo
		], [this.VENDOR, this.MODEL, [this.TYPE, this.CONSOLE]], [

			/android.+;\s(shield)\sbuild/i                                      // Nvidia
		], [this.MODEL, [this.VENDOR, 'Nvidia'], [this.TYPE, this.CONSOLE]], [

			/(playstation\s[34portablevi]+)/i                                   // Playstation
		], [this.MODEL, [this.VENDOR, 'Sony'], [this.TYPE, this.CONSOLE]], [

			/(sprint\s(\w+))/i                                                  // Sprint Phones
		], [[this.VENDOR, this.mapper.str, this.maps.device.sprint.vendor], [this.MODEL, this.mapper.str, this.maps.device.sprint.model], [this.TYPE, this.MOBILE]], [

			/(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
		], [this.VENDOR, this.MODEL, [this.TYPE, this.TABLET]], [

			/(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
			/(zte)-(\w+)*/i,                                                    // ZTE
			/(alcatel|geeksphone|huawei|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
			// Alcatel/GeeksPhone/Huawei/Lenovo/Nexian/Panasonic/Sony
		], [this.VENDOR, [this.MODEL, /_/g, ' '], [this.TYPE, this.MOBILE]], [

			/(nexus\s9)/i                                                       // HTC Nexus 9
		], [this.MODEL, [this.VENDOR, 'HTC'], [this.TYPE, this.TABLET]], [

			/[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
		], [this.MODEL, [this.VENDOR, 'Microsoft'], [this.TYPE, this.CONSOLE]], [
			/(kin\.[onetw]{3})/i                                                // Microsoft Kin
		], [[this.MODEL, /\./g, ' '], [this.VENDOR, 'Microsoft'], [this.TYPE, this.MOBILE]], [

			// Motorola
			/\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i,
			/mot[\s-]?(\w+)*/i,
			/(XT\d{3,4}) build\//i,
			/(nexus\s[6])/i
		], [this.MODEL, [this.VENDOR, 'Motorola'], [this.TYPE, this.MOBILE]], [
			/android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
		], [this.MODEL, [this.VENDOR, 'Motorola'], [this.TYPE, this.TABLET]], [

			/android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n8000|sgh-t8[56]9|nexus 10))/i,
			/((SM-T\w+))/i
		], [[this.VENDOR, 'Samsung'], this.MODEL, [this.TYPE, this.TABLET]], [                  // Samsung
			/((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-n900))/i,
			/(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
			/sec-((sgh\w+))/i
		], [[this.VENDOR, 'Samsung'], this.MODEL, [this.TYPE, this.MOBILE]], [
			/(samsung);smarttv/i
		], [this.VENDOR, this.MODEL, [this.TYPE, this.SMARTTV]], [

			/\(dtv[\);].+(aquos)/i                                              // Sharp
		], [this.MODEL, [this.VENDOR, 'Sharp'], [this.TYPE, this.SMARTTV]], [
			/sie-(\w+)*/i                                                       // Siemens
		], [this.MODEL, [this.VENDOR, 'Siemens'], [this.TYPE, this.MOBILE]], [

			/(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
			/(nokia)[\s_-]?([\w-]+)*/i
		], [[this.VENDOR, 'Nokia'], this.MODEL, [this.TYPE, this.MOBILE]], [

			/android\s3\.[\s\w;-]{10}(a\d{3})/i                                 // Acer
		], [this.MODEL, [this.VENDOR, 'Acer'], [this.TYPE, this.TABLET]], [

			/android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
		], [[this.VENDOR, 'LG'], this.MODEL, [this.TYPE, this.TABLET]], [
			/(lg) netcast\.tv/i                                                 // LG SmartTV
		], [this.VENDOR, this.MODEL, [this.TYPE, this.SMARTTV]], [
			/(nexus\s[45])/i,                                                   // LG
			/lg[e;\s\/-]+(\w+)*/i
		], [this.MODEL, [this.VENDOR, 'LG'], [this.TYPE, this.MOBILE]], [

			/android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
		], [this.MODEL, [this.VENDOR, 'Lenovo'], [this.TYPE, this.TABLET]], [

			/linux;.+((jolla));/i                                               // Jolla
		], [this.VENDOR, this.MODEL, [this.TYPE, this.MOBILE]], [

			/((pebble))app\/[\d\.]+\s/i                                         // Pebble
		], [this.VENDOR, this.MODEL, [this.TYPE, this.WEARABLE]], [

			/android.+;\s(glass)\s\d/i                                          // Google Glass
		], [this.MODEL, [this.VENDOR, 'Google'], [this.TYPE, this.WEARABLE]], [

			/android.+(\w+)\s+build\/hm\1/i,                                        // Xiaomi Hongmi 'numeric' models
			/android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,                   // Xiaomi Hongmi
			/android.+(mi[\s\-_]*(?:one|one[\s_]plus)?[\s_]*(?:\d\w)?)\s+build/i    // Xiaomi Mi
		], [[this.MODEL, /_/g, ' '], [this.VENDOR, 'Xiaomi'], [this.TYPE, this.MOBILE]], [

			/\s(tablet)[;\/\s]/i,                                               // Unidentifiable Tablet
			/\s(mobile)[;\/\s]/i                                                // Unidentifiable Mobile
		], [[this.TYPE, this.util.lowerize], this.VENDOR, this.MODEL]
		],

		engine: [[

			/windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
		], [this.VERSION, [this.NAME, 'EdgeHTML']], [

			/(presto)\/([\w\.]+)/i,                                             // Presto
			/(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
			/(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
			/(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
		], [this.NAME, this.VERSION], [

			/rv\:([\w\.]+).*(gecko)/i                                           // Gecko
		], [this.VERSION, this.NAME]
		],

		os: [[

			// Windows based
			/microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
		], [this.NAME, this.VERSION], [
			/(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
			/(windows\sphone(?:\sos)*|windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
		], [this.NAME, [this.VERSION, this.mapper.str, this.maps.os.windows.version]], [
			/(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
		], [[this.NAME, 'Windows'], [this.VERSION, this.mapper.str, this.maps.os.windows.version]], [

			// Mobile/Embedded OS
			/\((bb)(10);/i                                                      // BlackBerry 10
		], [[this.NAME, 'BlackBerry'], this.VERSION], [
			/(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
			/(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
			/(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
			// Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
			/linux;.+(sailfish);/i                                              // Sailfish OS
		], [this.NAME, this.VERSION], [
			/(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
		], [[this.NAME, 'Symbian'], this.VERSION], [
			/\((series40);/i                                                    // Series 40
		], [this.NAME], [
			/mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
		], [[this.NAME, 'Firefox OS'], this.VERSION], [

			// Console
			/(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

			// GNU/Linux based
			/(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
			/(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
			/(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?([\w\.-]+)*/i,
			// Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
			// Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
			/(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
			/(gnu)\s?([\w\.]+)*/i                                               // GNU
		], [this.NAME, this.VERSION], [

			/(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
		], [[this.NAME, 'Chromium OS'], this.VERSION], [

			// Solaris
			/(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
		], [[this.NAME, 'Solaris'], this.VERSION], [

			// BSD based
			/\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
		], [this.NAME, this.VERSION], [

			/(ip[honead]+)(?:.*os\s([\w]+)*\slike\smac|;\sopera)/i              // iOS
		], [[this.NAME, 'iOS'], [this.VERSION, /_/g, '.']], [

			/(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
			/(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
		], [[this.NAME, 'Mac OS'], [this.VERSION, /_/g, '.']], [

			// Other
			/((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
			/(haiku)\s(\w+)/i,                                                  // Haiku
			/(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
			/(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
			// Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
			/(unix)\s?([\w\.]+)*/i                                              // UNIX
		], [this.NAME, this.VERSION]
		]
	};

	/////////////////
	// Constructor
	////////////////

	constructor() {

		let ua = ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : this.EMPTY);
		let rgxmap = this.regexes;

		this.getBrowser = function () {
			let browser = this.mapper.rgx.apply(this, rgxmap.browser);
			browser.major = this.util.major(browser.version);
			return browser;
		};
		this.getCPU = function () {
			return this.mapper.rgx.apply(this, rgxmap.cpu);
		};
		this.getDevice = function () {
			return this.mapper.rgx.apply(this, rgxmap.device);
		};
		this.getEngine = function () {
			return this.mapper.rgx.apply(this, rgxmap.engine);
		};
		this.getOS = function () {
			return this.mapper.rgx.apply(this, rgxmap.os);
		};
		this.getResult = function () {
			return {
				ua: this.getUA(),
				browser: this.getBrowser(),
				engine: this.getEngine(),
				os: this.getOS(),
				device: this.getDevice(),
				cpu: this.getCPU()
			};
		};
		this.getUA = function () {
			return ua;
		};
		this.setUA = function (uastring) {
			ua = uastring;
			return this;
		};
		this.setUA(ua);

		this.VERSION = this.LIBVERSION;
		this.BROWSER = {
			NAME: this.NAME,
			MAJOR: this.MAJOR, // deprecated
			VERSION: this.VERSION
		};
		this.CPU = {
			ARCHITECTURE: this.ARCHITECTURE
		};
		this.DEVICE = {
			MODEL: this.MODEL,
			VENDOR: this.VENDOR,
			TYPE: this.TYPE,
			CONSOLE: this.CONSOLE,
			MOBILE: this.MOBILE,
			SMARTTV: this.SMARTTV,
			TABLET: this.TABLET,
			WEARABLE: this.WEARABLE,
			EMBEDDED: this.EMBEDDED
		};
		this.ENGINE = {
			NAME: this.NAME,
			VERSION: this.VERSION
		};
		this.OS = {
			NAME: this.NAME,
			VERSION: this.VERSION
		};
	}
}
