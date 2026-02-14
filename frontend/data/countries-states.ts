export interface State {
    name: string;
    code: string;
}

export interface Country {
    name: string;
    code: string;
    states: State[];
}

export const countries: Country[] = [
    {
        name: "India",
        code: "IN",
        states: [
            { name: "Andhra Pradesh", code: "AP" },
            { name: "Arunachal Pradesh", code: "AR" },
            { name: "Assam", code: "AS" },
            { name: "Bihar", code: "BR" },
            { name: "Chhattisgarh", code: "CG" },
            { name: "Goa", code: "GA" },
            { name: "Gujarat", code: "GJ" },
            { name: "Haryana", code: "HR" },
            { name: "Himachal Pradesh", code: "HP" },
            { name: "Jharkhand", code: "JK" },
            { name: "Karnataka", code: "KA" },
            { name: "Kerala", code: "KL" },
            { name: "Madhya Pradesh", code: "MP" },
            { name: "Maharashtra", code: "MH" },
            { name: "Manipur", code: "MN" },
            { name: "Meghalaya", code: "ML" },
            { name: "Mizoram", code: "MZ" },
            { name: "Nagaland", code: "NL" },
            { name: "Odisha", code: "OR" },
            { name: "Punjab", code: "PB" },
            { name: "Rajasthan", code: "RJ" },
            { name: "Sikkim", code: "SK" },
            { name: "Tamil Nadu", code: "TN" },
            { name: "Telangana", code: "TG" },
            { name: "Tripura", code: "TR" },
            { name: "Uttar Pradesh", code: "UP" },
            { name: "Uttarakhand", code: "UT" },
            { name: "West Bengal", code: "WB" },
            { name: "Delhi", code: "DL" }
        ]
    },
    {
        name: "United States",
        code: "US",
        states: [
            { name: "Alabama", code: "AL" },
            { name: "Alaska", code: "AK" },
            { name: "Arizona", code: "AZ" },
            { name: "Arkansas", code: "AR" },
            { name: "California", code: "CA" },
            { name: "Colorado", code: "CO" },
            { name: "Connecticut", code: "CT" },
            { name: "Delaware", code: "DE" },
            { name: "Florida", code: "FL" },
            { name: "Georgia", code: "GA" },
            { name: "Hawaii", code: "HI" },
            { name: "Idaho", code: "ID" },
            { name: "Illinois", code: "IL" },
            { name: "Indiana", code: "IN" },
            { name: "Iowa", code: "IA" },
            { name: "Kansas", code: "KS" },
            { name: "Kentucky", code: "KY" },
            { name: "Louisiana", code: "LA" },
            { name: "Maine", code: "ME" },
            { name: "Maryland", code: "MD" },
            { name: "Massachusetts", code: "MA" },
            { name: "Michigan", code: "MI" },
            { name: "Minnesota", code: "MN" },
            { name: "Mississippi", code: "MS" },
            { name: "Missouri", code: "MO" },
            { name: "Montana", code: "MT" },
            { name: "Nebraska", code: "NE" },
            { name: "Nevada", code: "NV" },
            { name: "New Hampshire", code: "NH" },
            { name: "New Jersey", code: "NJ" },
            { name: "New Mexico", code: "NM" },
            { name: "New York", code: "NY" },
            { name: "North Carolina", code: "NC" },
            { name: "North Dakota", code: "ND" },
            { name: "Ohio", code: "OH" },
            { name: "Oklahoma", code: "OK" },
            { name: "Oregon", code: "OR" },
            { name: "Pennsylvania", code: "PA" },
            { name: "Rhode Island", code: "RI" },
            { name: "South Carolina", code: "SC" },
            { name: "South Dakota", code: "SD" },
            { name: "Tennessee", code: "TN" },
            { name: "Texas", code: "TX" },
            { name: "Utah", code: "UT" },
            { name: "Vermont", code: "VT" },
            { name: "Virginia", code: "VA" },
            { name: "Washington", code: "WA" },
            { name: "West Virginia", code: "WV" },
            { name: "Wisconsin", code: "WI" },
            { name: "Wyoming", code: "WY" }
        ]
    },
    {
        name: "United Kingdom",
        code: "GB",
        states: [
            { name: "England", code: "ENG" },
            { name: "Scotland", code: "SCT" },
            { name: "Wales", code: "WLS" },
            { name: "Northern Ireland", code: "NIR" }
        ]
    },
    {
        name: "Canada",
        code: "CA",
        states: [
            { name: "Alberta", code: "AB" },
            { name: "British Columbia", code: "BC" },
            { name: "Manitoba", code: "MB" },
            { name: "New Brunswick", code: "NB" },
            { name: "Newfoundland and Labrador", code: "NL" },
            { name: "Nova Scotia", code: "NS" },
            { name: "Ontario", code: "ON" },
            { name: "Prince Edward Island", code: "PE" },
            { name: "Quebec", code: "QC" },
            { name: "Saskatchewan", code: "SK" }
        ]
    },
    {
        name: "Australia",
        code: "AU",
        states: [
            { name: "New South Wales", code: "NSW" },
            { name: "Queensland", code: "QLD" },
            { name: "South Australia", code: "SA" },
            { name: "Tasmania", code: "TAS" },
            { name: "Victoria", code: "VIC" },
            { name: "Western Australia", code: "WA" }
        ]
    },
    {
        name: "United Arab Emirates",
        code: "AE",
        states: [
            { name: "Abu Dhabi", code: "AZ" },
            { name: "Ajman", code: "AJ" },
            { name: "Dubai", code: "DU" },
            { name: "Fujairah", code: "FU" },
            { name: "Ras Al Khaimah", code: "RK" },
            { name: "Sharjah", code: "SH" },
            { name: "Umm Al Quwain", code: "UQ" }
        ]
    },
    {
        name: "Singapore",
        code: "SG",
        states: [
            { name: "Central Singapore", code: "CS" },
            { name: "North East", code: "NE" },
            { name: "North West", code: "NW" },
            { name: "South East", code: "SE" },
            { name: "South West", code: "SW" }
        ]
    },
    {
        name: "Germany",
        code: "DE",
        states: [
            { name: "Baden-Württemberg", code: "BW" },
            { name: "Bavaria", code: "BY" },
            { name: "Berlin", code: "BE" },
            { name: "Brandenburg", code: "BB" },
            { name: "Bremen", code: "HB" },
            { name: "Hamburg", code: "HH" },
            { name: "Hesse", code: "HE" },
            { name: "Lower Saxony", code: "NI" },
            { name: "Mecklenburg-Vorpommern", code: "MV" },
            { name: "North Rhine-Westphalia", code: "NW" },
            { name: "Rhineland-Palatinate", code: "RP" },
            { name: "Saarland", code: "SL" },
            { name: "Saxony", code: "SN" },
            { name: "Saxony-Anhalt", code: "ST" },
            { name: "Schleswig-Holstein", code: "SH" },
            { name: "Thuringia", code: "TH" }
        ]
    }
];
