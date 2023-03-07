import ByteBuffer = require("bytebuffer");

export enum Region {
	Default,
	JP,
}

export enum Relationship {
	Unknown,
	Friend,
	Lover,
	Ex,
	Spouse,
	SpouseRaisingChild, // i think?
	ExSpouse,
	ParentChild,
	Sibling,
	FriendInConflict,
	LoverInConflict,
	SpouseInConflict,
	BestFriend,
}

export enum Gender {
	Male,
	Female,
}

export class Mii {
	public index: number;

	public nickname: string;
	public miiData: ArrayBuffer;
	public miiImageUrl: string;
	public gender: Gender;

	public relationships: Relationship[];

	// baby stuff
	public spouse: Mii = null;
	public mother: Mii = null;
	public father: Mii = null;
	public children: Mii[] = [];

	public AddChild(child: Mii) {
		if (!this.children.includes(child)) {
			this.children.push(child);
		}
	}
}

export class SaveFileReader {
	private readonly reader: ByteBuffer;

	constructor(arrayBuffer: ArrayBuffer, private readonly region: Region) {
		this.reader = new ByteBuffer();
		this.reader.append(arrayBuffer);
	}

	private static ReadUtf16String(arrayBuffer: ArrayBuffer): string {
		let output = "";
		const bytes = new Uint16Array(arrayBuffer);
		const decoder = new TextDecoder("utf-16le");

		for (let i = 0; i < bytes.length; i++) {
			const byte = bytes[i];
			if (byte == 0) break;

			const char = decoder.decode(new Uint16Array([byte]));
			output += char;
		}

		return output;
	}

	private static GetGender(miiData: ArrayBuffer): Gender {
		// https://www.3dbrew.org/wiki/Mii#Mii_format

		const bits = new Uint8Array(miiData)[0x18].toString(2);
		const gender = parseInt(bits[bits.length - 1]); // last one
		return gender;
	}

	private static ToHexString(arrayBuffer: ArrayBuffer) {
		let hexString = "";
		const bytes = Array.from(new Uint8Array(arrayBuffer));
		for (const byte of bytes) {
			hexString += byte.toString(16).padStart(2, "0");
		}
		return hexString;
	}

	private static CacheMiiString(miiData: ArrayBuffer, miiString: string) {
		let currentCache = {};
		try {
			currentCache = JSON.parse(
				localStorage.getItem("miiStringCache") ?? "{}",
			);
		} catch (error) {}

		const key = this.ToHexString(miiData);
		currentCache[key] = miiString;

		localStorage.setItem("miiStringCache", JSON.stringify(currentCache));
	}

	private static GetCachedMiiString(miiData: ArrayBuffer) {
		try {
			const cache = JSON.parse(
				localStorage.getItem("miiStringCache") ?? "{}",
			);

			const key = this.ToHexString(miiData);

			return cache[key];
		} catch (error) {
			return null;
		}
	}

	private static async GetMiiString(miiData: ArrayBuffer) {
		// https://pf2m.com/tools/mii/

		const cachedMiiString = this.GetCachedMiiString(miiData);
		if (cachedMiiString != null) {
			return cachedMiiString;
		}

		try {
			const formData = new FormData();
			formData.append("platform", "gen2");
			formData.append("data", new Blob([miiData]), "mii.cfsd");

			const response = await fetch(
				"https://miicontestp.wii.rc24.xyz/cgi-bin/studio.cgi",
				{
					method: "POST",
					body: formData,
				},
			);

			const data = JSON.parse(await response.text());
			const miiString = data.mii;

			this.CacheMiiString(miiData, miiString);

			return miiString;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	private static async GetMiiImageUrl(miiData: ArrayBuffer) {
		const miiString = await this.GetMiiString(miiData);
		if (miiString == null) return "";

		return (
			"https://studio.mii.nintendo.com/miis/image.png?data=" + miiString
			// +
			// "&type=face&expression=normal&width=270&bgColor=FFFFFF00&clothesColor=default&cameraXRotate=0&cameraYRotate=0&cameraZRotate=0&characterXRotate=0&characterYRotate=0&characterZRotate=0&lightDirectionMode=none&instanceCount=1&instanceRotationMode=model"
		);
	}

	public async GetMiiData(): Promise<Mii[]> {
		const nameAddress = this.region == Region.JP ? 0x1c5a : 0x1c8a;
		const miiAddress = this.region == Region.JP ? 0x0 : 0x1c70;
		const nameMiiStride = this.region == Region.JP ? 0x0 : 0x660;

		const relationshipAddress = this.region == Region.JP ? 0x0 : 0x29a54;
		const relationshipStride = 0x100;

		const miis: Mii[] = [];

		for (var miiIndex = 0; miiIndex < 100; miiIndex++) {
			const nicknameBytes = this.reader
				.readBytes(20, nameAddress + miiIndex * nameMiiStride)
				.toArrayBuffer();

			if (new Uint8Array(nicknameBytes).every(b => b == 0)) {
				break;
			}

			const nickname = SaveFileReader.ReadUtf16String(nicknameBytes);

			const miiData = this.reader
				.readBytes(0x60, miiAddress + miiIndex * nameMiiStride)
				.toArrayBuffer();

			const relationships: Relationship[] = [];

			for (
				var relationshipIndex = 0;
				relationshipIndex < 100;
				relationshipIndex++
			) {
				relationships[relationshipIndex] = this.reader.readByte(
					relationshipAddress +
						miiIndex * relationshipStride +
						relationshipIndex,
				);
			}

			const mii = new Mii();
			mii.index = miiIndex;
			mii.nickname = nickname;
			mii.miiData = miiData;
			mii.gender = SaveFileReader.GetGender(miiData);
			mii.relationships = relationships;

			miis.push(mii);
		}

		// resize relationships

		for (const mii of miis) {
			mii.relationships = mii.relationships.slice(0, miis.length);
		}

		// find spouses

		const S00 = Relationship.Spouse;
		const S01 = Relationship.SpouseInConflict;
		const S02 = Relationship.SpouseRaisingChild;
		const ExS = Relationship.ExSpouse;

		for (const mii of miis) {
			for (const queryMii of miis) {
				if (
					(mii.relationships[queryMii.index] == S00 &&
						queryMii.relationships[mii.index] == S00) ||
					(mii.relationships[queryMii.index] == S01 &&
						queryMii.relationships[mii.index] == S01) ||
					(mii.relationships[queryMii.index] == S02 &&
						queryMii.relationships[mii.index] == S02)
				) {
					mii.spouse = queryMii;
					queryMii.spouse = mii;
				}
			}
		}

		// find parents

		// father is male
		// father => mother (spouse, in conflict, raising or ex spouse)
		// father => child (parent/child)
		//
		// mother is female
		// mother => father (spouse, in conflict or ex spouse)
		// mother => child (parent/child)
		//
		// child => father (parent/child)
		// child => mother (parent/child)

		for (const child of miis) {
			for (const father of miis) {
				for (const mother of miis) {
					if (
						// father
						father.gender == Gender.Male &&
						(father.relationships[mother.index] == S00 ||
							father.relationships[mother.index] == S01 ||
							father.relationships[mother.index] == S02 ||
							father.relationships[mother.index] == ExS) &&
						father.relationships[child.index] ==
							Relationship.ParentChild &&
						// mother
						mother.gender == Gender.Female &&
						(mother.relationships[father.index] == S00 ||
							mother.relationships[father.index] == S01 ||
							mother.relationships[father.index] == S02 ||
							mother.relationships[father.index] == ExS) &&
						mother.relationships[child.index] ==
							Relationship.ParentChild &&
						// child
						child.relationships[father.index] ==
							Relationship.ParentChild &&
						child.relationships[mother.index] ==
							Relationship.ParentChild
					) {
						child.mother = mother;
						child.father = father;

						mother.AddChild(child);
						father.AddChild(child);
					}
				}
			}
		}

		// get mii image urls

		const miiImageUrls = await Promise.all(
			miis.map(mii => SaveFileReader.GetMiiImageUrl(mii.miiData)),
		);

		for (let i = 0; i < miis.length; i++) {
			miis[i].miiImageUrl = miiImageUrls[i];
		}

		// yay return

		return miis;
	}
}
