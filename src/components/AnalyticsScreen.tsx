import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertCircle, Droplets, Target } from 'lucide-react';

const moistureData = [
  { day: 'सोम', moisture: 65 },
  { day: 'मंगल', moisture: 62 },
  { day: 'बुध', moisture: 58 },
  { day: 'गुरु', moisture: 55 },
  { day: 'शुक्र', moisture: 60 },
  { day: 'शनि', moisture: 68 },
  { day: 'रवि', moisture: 70 },
];

const pestData = [
  { name: 'कम जोखिम', value: 60, color: '#4ade80' },
  { name: 'मध्यम', value: 25, color: '#fbbf24' },
  { name: 'उच्च', value: 15, color: '#f87171' },
];

const growthData = [
  { stage: 'अंकुरण', progress: 100 },
  { stage: 'वृद्धि', progress: 85 },
  { stage: 'फूल', progress: 45 },
  { stage: 'फल', progress: 20 },
];

export function AnalyticsScreen() {
  return (
    <div className="min-h-full bg-gradient-to-br from-green-50 to-amber-50 p-6 pb-24">
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <div className="text-4xl mb-2">📊</div>
        <h2 className="text-green-900 mb-1">विश्लेषण और सांख्यिकी</h2>
        <p className="text-green-700 text-sm">आपकी फसल की स्थिति</p>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5" />
            <p className="text-sm text-green-100">मिट्टी स्वास्थ्य</p>
          </div>
          <p className="text-3xl mb-1">8.2</p>
          <p className="text-xs text-green-100">/ 10 स्कोर</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <p className="text-sm text-amber-100">अनुमानित उपज</p>
          </div>
          <p className="text-3xl mb-1">92%</p>
          <p className="text-xs text-amber-100">लक्ष्य का</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm text-blue-100">वृद्धि दर</p>
          </div>
          <p className="text-3xl mb-1">+12%</p>
          <p className="text-xs text-blue-100">पिछले सप्ताह से</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm text-red-100">जोखिम स्तर</p>
          </div>
          <p className="text-3xl mb-1">कम</p>
          <p className="text-xs text-red-100">15% खतरा</p>
        </div>
      </div>

      {/* Moisture Trend Line Chart */}
      <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-blue-200">
        <h3 className="text-blue-900 mb-4 flex items-center gap-2">
          <Droplets className="w-5 h-5" />
          साप्ताहिक नमी प्रवृत्ति
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={moistureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              stroke="#4b5563" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#4b5563" 
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="moisture" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-blue-700 text-sm mt-2 text-center">नमी प्रतिशत (%)</p>
      </div>

      {/* Pest Risk Pie Chart */}
      <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 border-2 border-amber-200">
        <h3 className="text-amber-900 mb-4">🐛 कीट जोखिम वितरण</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pestData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pestData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {pestData.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Crop Growth Stage Bar Chart */}
      <div className="bg-white rounded-3xl shadow-lg p-5 border-2 border-green-200">
        <h3 className="text-green-900 mb-4">🌱 फसल वृद्धि चरण</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={growthData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              stroke="#4b5563"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              type="category" 
              dataKey="stage" 
              stroke="#4b5563"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="progress" radius={[0, 8, 8, 0]}>
              {growthData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.progress > 80 ? '#4ade80' :
                    entry.progress > 50 ? '#fbbf24' :
                    entry.progress > 30 ? '#fb923c' : '#94a3b8'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-green-700 text-sm mt-2 text-center">पूर्णता प्रतिशत (%)</p>
      </div>
    </div>
  );
}
