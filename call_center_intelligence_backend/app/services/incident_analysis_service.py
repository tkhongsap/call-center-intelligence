"""
Incident Analysis Service

Uses LLM to analyze incident details and generate:
- Summary (1-2 sentences)
- Priority score (1-100) and tier (low/medium/high)
"""

import os
import json
import logging
from typing import Optional, Dict, List
from openai import AsyncAzureOpenAI
from app.models.incident import PriorityLevel

# Configure logger for this module
logger = logging.getLogger(__name__)


class IncidentAnalysisService:
    """Service for analyzing incidents using LLM."""
    
    def __init__(self):
        """Initialize Azure OpenAI client."""
        self.client = AsyncAzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_CHAT_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_CHAT_API_VERSION", "2024-12-01-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_CHAT_ENDPOINT")
        )
        self.deployment_name = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "gpt-5-mini")
    
    async def analyze_incident(self, details: str) -> Dict[str, any]:
        """
        Analyze incident details using LLM.
        
        Args:
            details: The incident details text
            
        Returns:
            Dictionary with 'summary', 'score', and 'priority'
        """
        if not details or not details.strip():
            return {
                "summary": None,
                "score": None,
                "priority": None
            }
        
        try:
            prompt = self._build_analysis_prompt(details)
            
            response = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert customer service analyst. Analyze incident reports and provide concise summaries in Thai language and priority scores. Always respond in Thai for summaries."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.deployment_name
            )
            
            result = response.choices[0].message.content.strip()
            return self._parse_llm_response(result)
            
        except Exception as e:
            logger.error(f"Error analyzing incident: {type(e).__name__}: {str(e)}")
            return {
                "summary": None,
                "score": None,
                "priority": None
            }
    
    def _build_analysis_prompt(self, details: str) -> str:
        """Build the prompt for LLM analysis."""
        return f"""Analyze this customer incident report and provide:

1. A concise summary in Thai language (1-2 sentences maximum)
2. A severity score from 1-100 based on:
   - Customer impact (how many customers affected)
   - Urgency (how quickly it needs resolution)
   - Business impact (revenue, reputation, operations)
   - Complexity (how difficult to resolve)

Incident Details:
{details}

Respond in this exact format:
SUMMARY: [your 1-2 sentence summary in Thai]
SCORE: [number from 1-100]

Example:
SUMMARY: ลูกค้ารายงานปัญหาสินค้าชำรุดที่มีปัญหาคุณภาพส่งผลกระทบหลายหน่วย
SCORE: 75"""
    
    def _parse_llm_response(self, response: str) -> Dict[str, any]:
        """Parse the LLM response to extract summary and score."""
        summary = None
        score = None
        priority = None
        
        lines = response.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('SUMMARY:'):
                summary = line.replace('SUMMARY:', '').strip()
            elif line.startswith('SCORE:'):
                try:
                    score_str = line.replace('SCORE:', '').strip()
                    score = int(score_str)
                    # Ensure score is within range
                    score = max(1, min(100, score))
                    # Determine priority tier
                    priority = self._score_to_priority(score)
                except ValueError:
                    pass
        
        return {
            "summary": summary,
            "score": score,
            "priority": priority
        }
    
    def _score_to_priority(self, score: int) -> PriorityLevel:
        """Convert score to priority tier."""
        if score >= 80:
            return PriorityLevel.HIGH
        elif score >= 50:
            return PriorityLevel.MEDIUM
        else:
            return PriorityLevel.LOW
    
    def _chunk_incidents(
        self, 
        incidents: List[Dict[str, str]], 
        batch_size: int = 20
    ) -> List[List[Dict[str, str]]]:
        """
        Split incidents into batches of specified size.
        
        Args:
            incidents: List of incident dicts with 'id' and 'details' keys
            batch_size: Number of incidents per batch (default 20)
            
        Returns:
            List of batches, where each batch is a list of incident dicts
        """
        if not incidents:
            return []
        
        batches = []
        for i in range(0, len(incidents), batch_size):
            batch = incidents[i:i + batch_size]
            batches.append(batch)
        
        return batches
    
    def _build_batch_prompt(self, batch: List[Dict[str, str]]) -> str:
        """
        Build prompt for batch analysis.
        
        Args:
            batch: List of incident dicts with 'id' and 'details' keys
            
        Returns:
            Formatted prompt string for batch analysis
        """
        # Build the incidents section with clear ID markers
        incidents_text = ""
        for incident in batch:
            incident_id = incident.get("id", "UNKNOWN")
            details = incident.get("details", "")
            incidents_text += f"\n[Incident ID: {incident_id}]\nDetails: {details}\n"
        
        prompt = f"""You are an expert customer service analyst. Analyze the following incident reports and provide:
1. A concise summary in Thai language (1-2 sentences maximum)
2. A severity score from 1-100 based on:
   - Customer impact (how many customers affected)
   - Urgency (how quickly it needs resolution)
   - Business impact (revenue, reputation, operations)
   - Complexity (how difficult to resolve)

Respond with a JSON object containing an "incidents" array with results for each incident.

Incidents to analyze:
{incidents_text}

Respond in this exact JSON format:
{{
    "incidents": [
        {{"id": "INC001", "summary": "Thai summary here", "score": 75}},
        {{"id": "INC002", "summary": "Thai summary here", "score": 30}}
    ]
}}

IMPORTANT: 
- All summaries MUST be in Thai language
- Provide exactly one result for each incident in the same order
- Scores must be between 1-100"""
        
        return prompt
    
    def _parse_batch_response(
        self, 
        response: str, 
        batch: List[Dict[str, str]]
    ) -> List[Dict[str, any]]:
        """
        Parse batch LLM response into individual results.
        
        Args:
            response: Raw LLM response text (expected to be JSON)
            batch: Original batch of incidents (for ID mapping and fallback)
            
        Returns:
            List of parsed results, one per incident in batch.
            Each result contains: 'id', 'summary', 'score', 'priority'
            Missing or invalid fields are set to None.
        """
        # Initialize results with None values for all incidents in batch
        results = []
        batch_ids = [inc.get("id") for inc in batch]
        
        # Create a map for quick lookup
        id_to_index = {inc_id: idx for idx, inc_id in enumerate(batch_ids)}
        
        # Initialize all results with None values
        for inc_id in batch_ids:
            results.append({
                "id": inc_id,
                "summary": None,
                "score": None,
                "priority": None
            })
        
        try:
            # Parse JSON response
            data = json.loads(response)
            
            # Extract incidents array
            if not isinstance(data, dict) or "incidents" not in data:
                # Malformed response - return None values
                return results
            
            incidents_data = data.get("incidents", [])
            
            if not isinstance(incidents_data, list):
                # Invalid incidents array - return None values
                return results
            
            # Process each incident in the response
            for incident_result in incidents_data:
                if not isinstance(incident_result, dict):
                    continue
                
                # Extract incident ID
                result_id = incident_result.get("id")
                
                if result_id is None or result_id not in id_to_index:
                    # ID missing or not in original batch - skip
                    continue
                
                # Get the index for this incident
                idx = id_to_index[result_id]
                
                # Extract summary (can be None or missing)
                summary = incident_result.get("summary")
                if summary is not None and not isinstance(summary, str):
                    summary = None
                
                # Extract and validate score
                score = incident_result.get("score")
                priority = None
                
                if score is not None:
                    try:
                        # Convert to int if needed
                        if isinstance(score, str):
                            score = int(score)
                        elif isinstance(score, float):
                            score = int(score)
                        elif not isinstance(score, int):
                            score = None
                        
                        # Validate range
                        if score is not None:
                            if score < 1 or score > 100:
                                score = None
                            else:
                                # Convert score to priority tier
                                priority = self._score_to_priority(score)
                    except (ValueError, TypeError):
                        score = None
                
                # Update the result for this incident
                results[idx] = {
                    "id": result_id,
                    "summary": summary,
                    "score": score,
                    "priority": priority
                }
        
        except json.JSONDecodeError:
            # Failed to parse JSON - return None values for all
            pass
        except Exception:
            # Any other error - return None values for all
            pass
        
        return results
    
    async def _process_batch(
        self, 
        batch: List[Dict[str, str]]
    ) -> List[Dict[str, any]]:
        """
        Process a single batch of incidents.
        
        Args:
            batch: List of incident dicts with 'id' and 'details' keys
            
        Returns:
            List of analysis results with 'id', 'summary', 'score', 'priority'
            Returns None values for incidents with empty details or on API failure
        """
        batch_size = len(batch)
        logger.info(f"Processing batch with {batch_size} incidents")
        
        # Filter out incidents with empty/None details before API call
        # Keep track of original batch for result mapping
        valid_incidents = []
        incident_id_to_original = {}
        
        for incident in batch:
            incident_id = incident.get("id")
            details = incident.get("details", "")
            
            # Check if details is empty or None
            if details and details.strip():
                valid_incidents.append(incident)
                incident_id_to_original[incident_id] = incident
        
        # Log filtering results
        filtered_count = batch_size - len(valid_incidents)
        if filtered_count > 0:
            logger.info(f"Filtered out {filtered_count} incidents with empty details")
        
        # If no valid incidents, return None values for all
        if not valid_incidents:
            logger.warning(f"No valid incidents in batch - all {batch_size} incidents have empty details")
            return [
                {
                    "id": inc.get("id"),
                    "summary": None,
                    "score": None,
                    "priority": None
                }
                for inc in batch
            ]
        
        try:
            # Build batch prompt using valid incidents only
            prompt = self._build_batch_prompt(valid_incidents)
            
            logger.info(f"Making API call for batch with {len(valid_incidents)} valid incidents")
            
            # Make async API call to Azure OpenAI
            response = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert customer service analyst. Analyze incident reports and provide concise summaries in Thai language and priority scores. Always respond in Thai for summaries. Respond only with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.deployment_name,
                response_format={"type": "json_object"}  # Force JSON output
            )
            
            logger.info(f"API call successful for batch with {len(valid_incidents)} incidents")
            
            # Check finish reason
            finish_reason = response.choices[0].finish_reason
            logger.info(f"LLM finish_reason: {finish_reason}")
            
            # Extract response content
            response_text = response.choices[0].message.content
            
            if response_text is None:
                logger.error(f"LLM returned None as response content. Finish reason: {finish_reason}")
                response_text = ""
            else:
                response_text = response_text.strip()
            
            # Log the full response for debugging
            logger.info(f"LLM Response length: {len(response_text)} characters")
            if len(response_text) > 0:
                logger.info(f"LLM Response preview (first 1000 chars): {response_text[:1000]}")
            else:
                logger.error(f"LLM Response is empty! Finish reason: {finish_reason}")
                # Log the full response object for debugging
                logger.error(f"Full response object: {response}")
            
            # Parse response using _parse_batch_response()
            valid_results = self._parse_batch_response(response_text, valid_incidents)
            
            # Count successful parses
            successful_parses = sum(1 for r in valid_results if r.get("summary") is not None)
            failed_parses = len(valid_results) - successful_parses
            
            if failed_parses > 0:
                logger.warning(
                    f"Parsing completed with {failed_parses} failures out of {len(valid_results)} incidents. "
                    f"Response sample (first 500 chars): {response_text[:500]}"
                )
            else:
                logger.info(f"Successfully parsed all {successful_parses} incident results")
            
            # Map results back to original batch (including filtered incidents)
            # Create a map of valid results by ID
            valid_results_map = {r["id"]: r for r in valid_results}
            
            # Build final results list matching original batch order
            final_results = []
            for incident in batch:
                incident_id = incident.get("id")
                if incident_id in valid_results_map:
                    final_results.append(valid_results_map[incident_id])
                else:
                    # Incident was filtered out (empty details)
                    final_results.append({
                        "id": incident_id,
                        "summary": None,
                        "score": None,
                        "priority": None
                    })
            
            return final_results
            
        except Exception as e:
            # Handle API errors - log and return None values for all incidents in batch
            logger.error(
                f"Batch API call failed for batch with {batch_size} incidents. "
                f"Error: {type(e).__name__}: {str(e)}"
            )
            return [
                {
                    "id": inc.get("id"),
                    "summary": None,
                    "score": None,
                    "priority": None
                }
                for inc in batch
            ]
    
    async def analyze_incidents_batch(
        self, 
        incidents: List[Dict[str, str]]
    ) -> List[Dict[str, any]]:
        """
        Analyze multiple incidents in batches using LLM.
        
        This method processes incidents in batches of 20 to improve efficiency
        and reduce API calls. Each batch is processed independently, so failures
        in one batch don't affect others.
        
        Args:
            incidents: List of dicts with 'id' and 'details' keys
                      Example: [{"id": "INC001", "details": "incident text"}, ...]
            
        Returns:
            List of dicts with 'id', 'summary', 'score', and 'priority'
            Results are in the same order as input incidents.
            Failed or empty incidents have None values for summary/score/priority.
            
        Example:
            >>> incidents = [
            ...     {"id": "INC001", "details": "Customer complaint about product"},
            ...     {"id": "INC002", "details": "Service request for information"}
            ... ]
            >>> results = await service.analyze_incidents_batch(incidents)
            >>> # Returns: [
            >>> #     {"id": "INC001", "summary": "...", "score": 75, "priority": "medium"},
            >>> #     {"id": "INC002", "summary": "...", "score": 30, "priority": "low"}
            >>> # ]
        """
        # Handle empty input
        if not incidents:
            logger.info("analyze_incidents_batch called with empty incident list")
            return []
        
        total_incidents = len(incidents)
        logger.info(f"Starting batch processing for {total_incidents} incidents")
        
        # Split incidents into batches of 20
        batches = self._chunk_incidents(incidents, batch_size=20)
        num_batches = len(batches)
        
        logger.info(f"Split {total_incidents} incidents into {num_batches} batches")
        
        # Process each batch independently
        all_results = []
        successful_batches = 0
        failed_batches = 0
        api_calls_made = 0
        
        for batch_idx, batch in enumerate(batches):
            try:
                logger.info(f"Processing batch {batch_idx + 1}/{num_batches} with {len(batch)} incidents")
                
                # Process this batch
                batch_results = await self._process_batch(batch)
                api_calls_made += 1
                
                # Collect results from this batch
                all_results.extend(batch_results)
                successful_batches += 1
                
                logger.info(f"Completed batch {batch_idx + 1}/{num_batches}")
                
            except Exception as e:
                # Handle batch failure - log error and add None values for this batch
                failed_batches += 1
                logger.error(
                    f"Failed to process batch {batch_idx + 1}/{num_batches} with {len(batch)} incidents. "
                    f"Error: {type(e).__name__}: {str(e)}"
                )
                
                # Add None results for all incidents in this failed batch
                for incident in batch:
                    all_results.append({
                        "id": incident.get("id"),
                        "summary": None,
                        "score": None,
                        "priority": None
                    })
        
        # Log final success metrics
        logger.info(
            f"Batch processing completed: {total_incidents} incidents processed in {num_batches} batches. "
            f"Success: {successful_batches} batches, Failed: {failed_batches} batches, "
            f"API calls made: {api_calls_made}"
        )
        
        # Return combined results maintaining input order
        # Results should already be in order since we process batches sequentially
        return all_results


# Singleton instance
_incident_analysis_service: Optional[IncidentAnalysisService] = None


def get_incident_analysis_service() -> IncidentAnalysisService:
    """Get or create the incident analysis service instance."""
    global _incident_analysis_service
    if _incident_analysis_service is None:
        _incident_analysis_service = IncidentAnalysisService()
    return _incident_analysis_service
