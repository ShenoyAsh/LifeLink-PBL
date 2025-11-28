const { GoogleGenerativeAI } = require('@google/generative-ai');
const BloodInventory = require('../models/BloodInventory');
const Donation = require('../models/Donation');
const Appointment = require('../models/Appointment');

class PredictionService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async predictShortage(bloodBankId, daysAhead = 7) {
    try {
      // Get historical inventory data
      const inventoryHistory = await BloodInventory.aggregate([
        {
          $match: { 
            bloodBank: bloodBankId,
            lastUpdated: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$lastUpdated" } },
              bloodType: "$bloodType"
            },
            avgQuantity: { $avg: "$quantity" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.date": 1 } }
      ]);

      // Get upcoming appointments
      const upcomingAppointments = await Appointment.aggregate([
        {
          $match: {
            bloodBank: bloodBankId,
            status: 'scheduled',
            date: { 
              $gte: new Date(),
              $lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: "$bloodType",
            count: { $sum: 1 }
          }
        }
      ]);

      // Get historical donation rates
      const donationRates = await Donation.aggregate([
        {
          $match: {
            bloodBank: bloodBankId,
            donationDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              bloodType: "$bloodType",
              month: { $month: "$donationDate" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.bloodType",
            avgMonthlyDonations: { $avg: "$count" }
          }
        }
      ]);

      // Prepare data for AI prediction
      const predictionData = {
        inventoryHistory,
        upcomingAppointments,
        donationRates,
        predictionWindow: daysAhead
      };

      // Generate AI prediction
      const prompt = `Given the following blood bank data, predict potential blood shortages in the next ${daysAhead} days. 
      Consider historical inventory levels, upcoming appointments, and donation rates.
      
      Data: ${JSON.stringify(predictionData, null, 2)}
      
      Provide the response in this JSON format:
      {
        "predictions": [
          {
            "bloodType": "A+",
            "riskLevel": "high|medium|low",
            "expectedShortage": number,
            "confidence": 0-1,
            "recommendations": ["string"]
          }
        ],
        "overallRisk": "high|medium|low",
        "nextDonationDriveRecommended": boolean,
        "priorityBloodTypes": ["A+", "B-", ...]
      }`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response
      let prediction;
      try {
        // Try to extract JSON from markdown code block if present
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        prediction = JSON.parse(jsonMatch ? jsonMatch[1] : text);
      } catch (e) {
        console.error('Error parsing AI response:', e);
        // Fallback to a safe default if parsing fails
        prediction = {
          predictions: [],
          overallRisk: 'unknown',
          nextDonationDriveRecommended: false,
          priorityBloodTypes: []
        };
      }

      return prediction;
    } catch (error) {
      console.error('Error in predictShortage:', error);
      throw new Error('Failed to generate prediction');
    }
  }

  async getShortageMitigationStrategies(bloodType, riskLevel) {
    try {
      const prompt = `Provide 3 specific, actionable strategies to mitigate potential blood shortage for blood type ${bloodType} 
      which is currently at ${riskLevel} risk level. Format the response as a JSON array of strings.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response
      try {
        const jsonMatch = text.match(/\[.*\]/s);
        return JSON.parse(jsonMatch ? jsonMatch[0] : `["No specific strategies available"]`);
      } catch (e) {
        console.error('Error parsing strategies:', e);
        return ["Increase donor outreach", "Organize blood drives", "Contact regular donors"];
      }
    } catch (error) {
      console.error('Error getting mitigation strategies:', error);
      return ["Error loading strategies"];
    }
  }
}

module.exports = new PredictionService();
