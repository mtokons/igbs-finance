import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function parseJoinDate(text: string): Date {
  const [monthName, yearStr] = text.trim().split(/\s+/);
  const month = MONTHS[monthName.toLowerCase()];
  const year = parseInt(yearStr, 10);
  return new Date(Date.UTC(year, month ?? 0, 1));
}

function parseFee(text: string): number {
  const match = text.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

interface Row {
  memberCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  memberType: string;
  fee: string;
  joinDate: string;
}

const rows: Row[] = [
  { memberCode: "IGBS00", fullName: "IGBS Openings Account", memberType: "All", fee: "0", joinDate: "November 2019" },
  { memberCode: "IGBS01", fullName: "Adnan ABDUL HAI", email: "adnanabdulhai@gmail.com", phone: "0152559101", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2020" },
  { memberCode: "IGBS02", fullName: "Julfiqur Haider", email: "haiderjulfiqur400@gmail.com", address: "Billstedter Hauptstr. 75", memberType: "Regular Member", fee: "10 Euro", joinDate: "November 2019" },
  { memberCode: "IGBS03", fullName: "Abdul Mabud", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2020" },
  { memberCode: "IGBS04", fullName: "Hosnayen Alam Siddiquee", email: "hosnayen.cse@gmail.com", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2020" },
  { memberCode: "IGBS05", fullName: "Anisul Hoque", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2020" },
  { memberCode: "IGBS06", fullName: "Abubakar Abdullah", memberType: "Student Member", fee: "10 Euro", joinDate: "January 2020" },
  { memberCode: "IGBS07", fullName: "Siam", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2020" },
  { memberCode: "IGBS08", fullName: "Muhammad Hasnain", email: "mhasnainn@gmail.com", phone: "016096887026", address: "Julius Ludowieg Str 46,21073 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2022" },
  { memberCode: "IGBS09", fullName: "Muhammad Zahir Hassan Nabil", memberType: "Student Member", fee: "5 Euro", joinDate: "January 2022" },
  { memberCode: "IGBS10", fullName: "ASIF HOSSAIN", email: "habrontheraizo@gmail.com", memberType: "Regular Member", fee: "5 Euro", joinDate: "January 2022" },
  { memberCode: "IGBS11", fullName: "Md Rakibul Ahsan", memberType: "Student Member", fee: "5 Euro", joinDate: "January 2022" },
  { memberCode: "IGBS12", fullName: "MD WASSIM SAZZAD", email: "wassim.iut@gmail.com", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2022" },
  { memberCode: "IGBS13", fullName: "MOHAMMAD REZWAN WASTI", email: "mrw.86@gmx.de", phone: "01622768958", memberType: "Regular Member", fee: "10 Euro", joinDate: "September 2022" },
  { memberCode: "IGBS14", fullName: "Azad Faruk", email: "farukazad78@gmail.com", phone: "015166884414", memberType: "Regular Member", fee: "10 Euro", joinDate: "September 2022" },
  { memberCode: "IGBS15", fullName: "Tanvir Ahmed", email: "putnvr@gmail.com", phone: "015222560604", memberType: "Regular Member", fee: "10 Euro", joinDate: "September 2022" },
  { memberCode: "IGBS16", fullName: "M Sadman Sakib", email: "m.sadman.sakib@gmail.com", phone: "015732265134", memberType: "Regular Member", fee: "10 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS17", fullName: "Sheik Benazir Ahmed", email: "benazir8513@gmail.com", phone: "01781798465", memberType: "Student Member", fee: "5 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS18", fullName: "Iqbal, Shahria Ahammed", email: "iqbal.shahria@gmail.com", phone: "017643868644", memberType: "Regular Member", fee: "10 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS19", fullName: "Raian Siddique", email: "raian.siddique@gmail.com", phone: "015758240151", memberType: "Student Member", fee: "5 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS20", fullName: "Abdullah Al Hasan", email: "hasan.rqb@gmail.com", phone: "015735223830", memberType: "Student Member", fee: "5 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS21", fullName: "Farhan Matin", email: "farhanmatin@gmail.com", phone: "01721503248", memberType: "Regular Member", fee: "10 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS22", fullName: "Jamil Gazi", email: "jgazi@yahoo.de", phone: "004915735260845", memberType: "Regular Member", fee: "10 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS23", fullName: "Syed Mohammad Tazuddin", email: "tazuddin1000@gmail.com", phone: "017632413480", memberType: "Regular Member", fee: "10 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS24", fullName: "Md Mijanur Rahaman", email: "mijurehman4211@gmail.com", phone: "004917663367291", memberType: "Student Member", fee: "5 Euro", joinDate: "October 2022" },
  { memberCode: "IGBS25", fullName: "Sentu", memberType: "Regular Member", fee: "10 Euro", joinDate: "April 2022" },
  { memberCode: "IGBS26", fullName: "Syed Marzan Ul Hasan", memberType: "Madrasha", fee: "10 Euro", joinDate: "April 2022" },
  { memberCode: "IGBS27", fullName: "Aman Ullah", email: "aman.acce@gmail.com", phone: "017676769666", address: "Stellbrinkweg 22", memberType: "Student Member", fee: "5 Euro", joinDate: "November 2022" },
  { memberCode: "IGBS28", fullName: "Mohammad Omar Faruk", email: "infomfaruk@gmail.com", phone: "01794397795", address: "Kieler Straße 70, 22769 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "May 2023" },
  { memberCode: "IGBS29", fullName: "Md Masud Rana", email: "masudrana.eee.iu@gmail.com", phone: "017620580823", address: "Lüneburger Str. 7", memberType: "Student Member", fee: "5 Euro", joinDate: "November 2022" },
  { memberCode: "IGBS30", fullName: "Zaheen Azad", email: "zyanzen.me+igfbs@gmail.com", phone: "01725823717", address: "Bömelburgweg 20", memberType: "Regular Member", fee: "10 Euro", joinDate: "November 2022" },
  { memberCode: "IGBS31", fullName: "Chowdhury Mustazabur Rahman", email: "rahman.roktim@gmail.com", phone: "017620013128", address: "Isebekstrasse 20, 22769 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2023" },
  { memberCode: "IGBS32", fullName: "Md Sadequle Islam", email: "sadequle.eng@cu.ac.bd", phone: "015752940849", address: "Sedanstraße 24, Apartment No. 36", memberType: "Student Member", fee: "5 Euro", joinDate: "January 2023" },
  { memberCode: "IGBS33", fullName: "Touseef Ahmed", email: "touseef_fcc@web.de", phone: "017685617341", address: "Meyerstraße 22, 21075 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "January 2023" },
  { memberCode: "IGBS34", fullName: "Md Sajjad Hossain Rabbi", email: "sajjadhossain.de@gmail.com", phone: "015210558184", address: "Hagenbeckstraße 50, 22527, Hamburg", memberType: "Student Member", fee: "5 Euro", joinDate: "February 2023" },
  { memberCode: "IGBS35", fullName: "Muhammad Munir Hussain", email: "munir.juwel@gmail.com", phone: "015901371634", address: "Borgfelder str. 16", memberType: "Regular Member", fee: "10 Euro", joinDate: "February 2023" },
  { memberCode: "IGBS36", fullName: "Mohiuddin Khan", email: "khan.mohiuddin4567@gmail.com", phone: "015218143478", address: "Sieversstúcken 3, 22589 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "May 2023" },
  { memberCode: "IGBS37", fullName: "Abdullah Zehad", email: "ab.zehad@gmail.com", phone: "017656903216", address: "Brekelbaums Park 2", memberType: "Student Member", fee: "5 Euro", joinDate: "May 2023" },
  { memberCode: "IGBS38", fullName: "Md Rezwan A Rasik", email: "rezwanrasik9@gmail.com", phone: "01634034677", address: "Barmbeker strasse 64, 22303, Hamburg", memberType: "Student Member", fee: "5 Euro", joinDate: "June 2023" },
  { memberCode: "IGBS39", fullName: "TM Moniruzzaman Sunny", email: "tmmsunny@gmail.com", phone: "01724253469", address: "Bremerstr. 103a, 21073 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "July 2023" },
  { memberCode: "IGBS40", fullName: "Makhzumi Mahmood", email: "makhzumi.1@gmail.com", phone: "017656926753", address: "Am Centrumshaus 2,21073 Hamburg", memberType: "Student Member", fee: "5 Euro", joinDate: "July 2023" },
  { memberCode: "IGBS41", fullName: "Samiur Reza", email: "samiurreza@yahoo.com", phone: "017643278984", address: "Kieler Straße 659, 22527 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "August 2023" },
  { memberCode: "IGBS42", fullName: "Syed Hasib Rahaber", email: "syedhasib269@gmail.com", phone: "017641545969", address: "Vorsterhauser Weg 81, Hamm", memberType: "Student Member", fee: "5 Euro", joinDate: "September 2023" },
  { memberCode: "IGBS43", fullName: "Md Kamruzzaman", email: "ryanruet@outlook.com", phone: "015780906736", address: "Am Sonnentau 1, 25436 Tornesch", memberType: "Regular Member", fee: "5 Euro", joinDate: "October 2023" },
  { memberCode: "IGBS44", fullName: "Md Mahmudur Rahman", email: "mailtommrr@gmail.com", phone: "4901628028023", address: "Birckholtzweg 13", memberType: "Regular Member", fee: "10 Euro", joinDate: "November 2023" },
  { memberCode: "IGBS45", fullName: "Md Wahiduzzaman Satu", email: "wahiduzzaman.satu231@gmail.com", phone: "015750727859", address: "Nordmeerstraße 28, 21129 Hamburg", memberType: "Regular Member", fee: "10 Euro", joinDate: "December 2023" },
  { memberCode: "IGBS46", fullName: "Shahidul Islam", email: "shahidulislam68@yahoo.de", phone: "017648158617", address: "Möllner Str. 11 , 22958 Kuddewörde", memberType: "Regular Member", fee: "10 Euro", joinDate: "December 2023" },
  { memberCode: "IGBS47", fullName: "Kazi Shahan Mohammad Shams", email: "shams.ustc@gmail.com", phone: "01605406880", address: "Dr.-Alexander Str 100", memberType: "Regular Member", fee: "10 Euro", joinDate: "June 2024" },
  { memberCode: "IGBS48", fullName: "Raisul Islam Shuvo", email: "dr.rishuvo@gmail.com", phone: "00491795251798", address: "Am Neugrabener Bahnhof 26, Hamburg 21149", memberType: "Student Member", fee: "5 Euro", joinDate: "June 2024" },
  { memberCode: "IGBS49", fullName: "Kazi Ataul Goni", email: "kazi.shahinbf@gmail.com", phone: "01629005294", address: "Haakestr 34", memberType: "Regular Member", fee: "10 Euro", joinDate: "July 2024" },
  { memberCode: "IGBS50", fullName: "Abdullah Zehad", email: "ab.zehad@gmail.com", phone: "017656903216", address: "Brekelbaums Park 2", memberType: "Student Member", fee: "5 Euro", joinDate: "July 2024" },
  { memberCode: "IGBS51", fullName: "Md Solaiman Anjum Piyash", email: "slmnanjmpiyash@gmail.com", phone: "017660444645", address: "Schüttstraße 3", memberType: "Student Member", fee: "5 Euro", joinDate: "September 2024" },
  { memberCode: "IGBS52", fullName: "MD Golam Rabbani", email: "rabbani.rub@gmail.com", phone: "01777974094", address: "21075 hamburg", memberType: "Student Member", fee: "5 Euro", joinDate: "September 2024" },
  { memberCode: "IGBS53", fullName: "Tanvir Hasan", email: "tvhsn124@gmail.com", phone: "4917645348950", address: "Stellbrinkweg 26,21035 Hamburg", memberType: "Student Member", fee: "5 Euro", joinDate: "January 2025" },
  { memberCode: "IGBS54", fullName: "Samima Begum Miah", phone: "491775076043", memberType: "Madrasha", fee: "10 Euro", joinDate: "June 2025" },
  { memberCode: "IGBS55", fullName: "Abu Firoz Ismail", phone: "41018191336", memberType: "Madrasha", fee: "10 Euro", joinDate: "June 2024" },
  { memberCode: "IGBS56", fullName: "Md Zaker", memberType: "Madrasha", fee: "10 Euro", joinDate: "June 2024" },
  { memberCode: "IGBS57", fullName: "Fazlul Hoque (Kashem)", memberType: "Madrasha", fee: "10 Euro", joinDate: "June 2024" },
  { memberCode: "IGBS58", fullName: "Babu Rahman", phone: "17623180744", memberType: "Madrasha", fee: "10 Euro", joinDate: "June 2025" },
  { memberCode: "IGBS59", fullName: "Muhammad Anisur Rahman", phone: "1799405990", memberType: "Madrasha", fee: "10 Euro", joinDate: "June 2025" },
  { memberCode: "IGBS60", fullName: "Rakib bhai", memberType: "Madrasha", fee: "10 Euro", joinDate: "January 2025" },
  { memberCode: "IGBS61", fullName: "Shoriful bhai", memberType: "Madrasha", fee: "10 Euro", joinDate: "January 2025" },
  { memberCode: "IGBS62", fullName: "Fayaz khan bhai", memberType: "Madrasha", fee: "10 Euro", joinDate: "January 2025" },
  { memberCode: "IGBS63", fullName: "Rayhanul", memberType: "Madrasha", fee: "10 Euro", joinDate: "January 2025" },
  { memberCode: "IGBS64", fullName: "Shakil bhai", memberType: "Madrasha", fee: "10 Euro", joinDate: "January 2025" },
  { memberCode: "IGBS65", fullName: "MD Saifur Rahman", email: "saifurimran99@gmail.com", phone: "015157464818", address: "Pinnauweg 28", memberType: "Student Member", fee: "5 Euro", joinDate: "July 2025" },
];

async function main() {
  console.log(`Removing existing dummy members (cascades payments/enrollments)...`);
  const deleted = await prisma.member.deleteMany({});
  console.log(`Deleted ${deleted.count} existing member(s).`);

  console.log(`Importing ${rows.length} IGBS members...`);
  for (const row of rows) {
    await prisma.member.create({
      data: {
        memberCode: row.memberCode,
        fullName: row.fullName,
        email: row.email || null,
        phone: row.phone || null,
        address: row.address || null,
        memberType: row.memberType,
        monthlyFee: parseFee(row.fee),
        joinDate: parseJoinDate(row.joinDate),
        status: "ACTIVE",
      },
    });
  }
  console.log("Import completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
