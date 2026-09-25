export const INDIAN_STATES_CITIES: Record<string, string[]> = {
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi", "East Delhi", "Dwarka"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Navi Mumbai"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Davangere"],
  "Punjab": ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Greater Noida", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Ghaziabad"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu"],
  "Chandigarh": ["Chandigarh"],
};

export const INDIAN_STATES = Object.keys(INDIAN_STATES_CITIES).sort();

export function getCitiesForState(state: string): string[] {
  if (!state || state === "all") {
    // Return unique list of all major cities
    const all = new Set<string>();
    Object.values(INDIAN_STATES_CITIES).forEach((cities) => {
      cities.forEach((c) => all.add(c));
    });
    return Array.from(all).sort();
  }
  return INDIAN_STATES_CITIES[state] || [];
}
