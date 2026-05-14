/// L5: Anomaly Detection via Reservoir Prediction Error
pub struct AnomalyDetector {
    pub threshold: i32,
    pub last_prediction_error: i32,
}

impl AnomalyDetector {
    pub fn check(&mut self, actual: i32, predicted: i32) -> bool {
        self.last_prediction_error = (actual - predicted).abs();
        self.last_prediction_error > self.threshold
    }
}
