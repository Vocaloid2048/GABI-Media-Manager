const {
    Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes, uid) => {
    class HistoryData extends Model {
        static associate(models) {
            // Associations are defined in models/index.js
        }
    }
    HistoryData.init({
        history_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // The group associated with this download (Main display info)
        group_id: {
            type: DataTypes.UUID, 
            allowNull: true 
        },
        // The specific video file (if applicable)
        video_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        action_type: {
            type: DataTypes.STRING, // 'DOWNLOAD', 'UPLOAD', 'VIEW'
            defaultValue: 'DOWNLOAD'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'HistoryData',
        tableName: 'history_data',
        underscored: true,
        timestamps: false 
    });
    return HistoryData;
};
