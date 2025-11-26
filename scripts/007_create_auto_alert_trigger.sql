-- Function to automatically create alerts for high-risk incidents
CREATE OR REPLACE FUNCTION public.create_alert_for_high_risk_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create alert if risk score > 0.8 or severity >= 4
  IF (NEW.risk_score > 0.8 OR NEW.severity >= 4) THEN
    INSERT INTO public.alerts (incident_id, title, message, severity, expires_at)
    VALUES (
      NEW.id,
      'High-Risk Incident Alert: ' || NEW.category,
      'A ' || NEW.category || ' incident with ' || 
      CASE 
        WHEN NEW.severity >= 4 THEN 'high severity'
        ELSE 'elevated risk'
      END || ' has been reported in your area. Stay vigilant and follow safety protocols.',
      NEW.severity,
      NOW() + INTERVAL '24 hours'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_alert_for_high_risk ON public.incidents;

CREATE TRIGGER trigger_create_alert_for_high_risk
  AFTER INSERT ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.create_alert_for_high_risk_incident();
