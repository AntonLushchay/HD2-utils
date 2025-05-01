import React, { useState } from 'react';
import EnemyModel from './components/EnemyModel';
import enemiesData from './data/enemies.json';
import './styles/common/global.css';

// Добавляем декларацию типа для импорта .glb файлов
declare module '*.glb?url' {
  const src: string;
  export default src;
}

// Типы для данных о врагах
interface Enemy {
  id: string;
  name: string;
  category: string;
  modelPath: string;
  characteristics: Record<string, any>;
}

// Импортируем модели напрямую из папки assets
import AlphaCommandeModel from './assets/models/Alpha_Commande.glb?url';
import HulkModel from './assets/models/Hulk.glb?url';
import StriderModel from './assets/models/Automaton_factory_strider.glb?url';
import TurretModel from './assets/models/turret.glb?url';

// Маппинг имен файлов на действительные URL ресурсов
const modelPaths: Record<string, string> = {
  'Alpha_Commande.glb': AlphaCommandeModel,
  'Hulk.glb': HulkModel,
  'Automaton_factory_strider.glb': StriderModel,
  'turret.glb': TurretModel
};

// Фильтрация врагов по категориям
const automatonsEnemies = (enemiesData as Enemy[]).filter(enemy => enemy.category === "Automatons");
const termenidsEnemies = (enemiesData as Enemy[]).filter(enemy => enemy.category === "Termenids");

const App: React.FC = () => {
  // Состояние для выбранной модели
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(automatonsEnemies[0].id);
  
  // Получаем выбранного врага из всего списка по ID
  const selectedEnemy = (enemiesData as Enemy[]).find(enemy => enemy.id === selectedEnemyId) || automatonsEnemies[0];
  
  // Вычисляем путь к модели напрямую из выбранного врага
  const modelUrl = modelPaths[selectedEnemy.modelPath] || '';
  const modelAvailable = !!modelUrl;

  // Обработчик изменения выбранной модели (общий для обоих списков)
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newEnemyId = event.target.value;
    if (newEnemyId) {
      setSelectedEnemyId(newEnemyId);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>HD2-utils: 3D Model Viewer</h1>
        <div className="model-selector">
          {/* Выпадающее меню для Automatons */}
          <label htmlFor="automatons-select">Automatons: </label>
          <select 
            id="automatons-select" 
            value={automatonsEnemies.some(e => e.id === selectedEnemyId) ? selectedEnemyId : ''}
            onChange={handleSelectChange}
            className="model-dropdown"
          >
            <option value="" disabled>Выберите модель</option>
            {automatonsEnemies.map(enemy => (
              <option key={enemy.id} value={enemy.id}>{enemy.name}</option>
            ))}
          </select>
          
          {/* Выпадающее меню для Termenids */}
          <label htmlFor="termenids-select" style={{ marginLeft: '20px' }}>Termenids: </label>
          <select 
            id="termenids-select" 
            value={termenidsEnemies.some(e => e.id === selectedEnemyId) ? selectedEnemyId : ''}
            onChange={handleSelectChange}
            className="model-dropdown"
          >
            <option value="" disabled>Выберите модель</option>
            {termenidsEnemies.map(enemy => (
              <option key={enemy.id} value={enemy.id}>{enemy.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <EnemyModel 
        key={`model-${selectedEnemyId}-${Date.now()}`} // Используем timestamp для гарантии пересоздания
        modelPath={modelUrl}
        modelAvailable={modelAvailable}
        characteristics={selectedEnemy.characteristics} 
      />
    </div>
  );
};

export default App;
