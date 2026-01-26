package com.ultron.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ultron.backend.domain.enums.*;
import com.ultron.backend.dto.request.*;
import com.ultron.backend.dto.response.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Integration Test for CRM Platform
 * Tests complete workflow across all modules:
 * 1. Authentication (Register & Login)
 * 2. Lead Management (Create, Update, Convert)
 * 3. Contact & Account Management (Verify creation from lead conversion)
 * 4. Opportunity Management (Create and track)
 * 5. Activity Management (Create activities)
 */
@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@ActiveProfiles("test")
class CrmIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        if (mockMvc == null) {
            mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
            objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        }
    }

    // Test data holders
    private static String authToken;
    private static String userId;
    private static String leadId;
    private static String contactId;
    private static String accountId;
    private static String opportunityId;
    private static String activityId;

    @Test
    @Order(1)
    @DisplayName("1. User Registration - Should create new user account")
    void testUserRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@crm.com")
                .password("Test@1234")
                .fullName("Test User")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.email").value("test@crm.com"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertTrue(responseBody.contains("test@crm.com"), "Response should contain user email");
    }

    @Test
    @Order(2)
    @DisplayName("2. User Login - Should authenticate and return JWT token")
    void testUserLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@crm.com")
                .password("Test@1234")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();

        // Extract token using simple string parsing
        int tokenStart = responseBody.indexOf("\"token\":\"") + 9;
        int tokenEnd = responseBody.indexOf("\"", tokenStart);
        authToken = responseBody.substring(tokenStart, tokenEnd);

        assertNotNull(authToken, "Auth token should not be null");
        assertTrue(authToken.length() > 0, "Auth token should not be empty");
    }

    @Test
    @Order(3)
    @DisplayName("3. Create Lead - Should create new lead with BANT scoring")
    void testCreateLead() throws Exception {
        CreateLeadRequest request = CreateLeadRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@techcorp.com")
                .phone("+1234567890")
                .companyName("TechCorp Inc")
                .jobTitle("CTO")
                .industry(Industry.TECHNOLOGY)
                .companySize(CompanySize.MEDIUM)
                .leadSource(LeadSource.WEBSITE)
                .expectedRevenue(new BigDecimal("50000"))
                .description("Interested in enterprise solution")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/leads")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.leadStatus").value("NEW"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();

        // Extract leadId
        int idStart = responseBody.indexOf("\"leadId\":\"") + 10;
        int idEnd = responseBody.indexOf("\"", idStart);
        leadId = responseBody.substring(idStart, idEnd);

        assertNotNull(leadId, "Lead ID should not be null");
        assertTrue(leadId.startsWith("LEAD-"), "Lead ID should start with LEAD-");
    }

    @Test
    @Order(4)
    @DisplayName("4. Update Lead to Qualified - Should update lead status and BANT fields")
    void testQualifyLead() throws Exception {
        UpdateLeadRequest request = UpdateLeadRequest.builder()
                .leadStatus(LeadStatus.QUALIFIED)
                .hasBudget(true)
                .budgetAmount(new BigDecimal("50000"))
                .isDecisionMaker(true)
                .businessProblem("Need CRM solution")
                .expectedPurchaseDate(LocalDate.now().plusMonths(2))
                .build();

        mockMvc.perform(put("/api/v1/leads/" + leadId)
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.leadStatus").value("QUALIFIED"))
                .andReturn();
    }

    @Test
    @Order(5)
    @DisplayName("5. Convert Lead - Should create Contact and Account from Lead")
    void testConvertLead() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/leads/" + leadId + "/convert")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.leadStatus").value("CONVERTED"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();

        // Extract contactId and accountId
        if (responseBody.contains("\"contactId\":\"")) {
            int contactIdStart = responseBody.indexOf("\"contactId\":\"") + 13;
            int contactIdEnd = responseBody.indexOf("\"", contactIdStart);
            contactId = responseBody.substring(contactIdStart, contactIdEnd);
        }

        if (responseBody.contains("\"accountId\":\"")) {
            int accountIdStart = responseBody.indexOf("\"accountId\":\"") + 13;
            int accountIdEnd = responseBody.indexOf("\"", accountIdStart);
            accountId = responseBody.substring(accountIdStart, accountIdEnd);
        }

        assertNotNull(contactId, "Contact ID should be created from lead conversion");
        assertNotNull(accountId, "Account ID should be created from lead conversion");
    }

    @Test
    @Order(6)
    @DisplayName("6. Create Opportunity - Should create opportunity linked to account and contact")
    void testCreateOpportunity() throws Exception {
        CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                .opportunityName("TechCorp Enterprise Deal")
                .accountId(accountId)
                .primaryContactId(contactId)
                .amount(new BigDecimal("75000"))
                .probability(50)
                .stage(OpportunityStage.QUALIFICATION)
                .expectedCloseDate(LocalDate.now().plusMonths(3))
                .description("Enterprise CRM implementation")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/opportunities")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.opportunityName").value("TechCorp Enterprise Deal"))
                .andExpect(jsonPath("$.data.stage").value("QUALIFICATION"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();

        // Extract opportunityId
        int idStart = responseBody.indexOf("\"opportunityId\":\"") + 17;
        int idEnd = responseBody.indexOf("\"", idStart);
        opportunityId = responseBody.substring(idStart, idEnd);

        assertNotNull(opportunityId, "Opportunity ID should not be null");
        assertTrue(opportunityId.startsWith("OPP-"), "Opportunity ID should start with OPP-");
    }

    @Test
    @Order(7)
    @DisplayName("7. Create Call Activity - Should create activity with call details")
    void testCreateCallActivity() throws Exception {
        CreateActivityRequest request = CreateActivityRequest.builder()
                .subject("Follow-up call with TechCorp")
                .type(ActivityType.CALL)
                .status(ActivityStatus.COMPLETED)
                .priority(ActivityPriority.HIGH)
                .opportunityId(opportunityId)
                .accountId(accountId)
                .contactId(contactId)
                .scheduledDate(LocalDateTime.now().minusHours(1))
                .phoneNumber("+1234567890")
                .callDirection("OUTBOUND")
                .callDuration(1800) // 30 minutes
                .description("Discussed project requirements and timeline")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/activities")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subject").value("Follow-up call with TechCorp"))
                .andExpect(jsonPath("$.data.type").value("CALL"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();

        // Extract activityId
        int idStart = responseBody.indexOf("\"activityId\":\"") + 14;
        int idEnd = responseBody.indexOf("\"", idStart);
        activityId = responseBody.substring(idStart, idEnd);

        assertNotNull(activityId, "Activity ID should not be null");
        assertTrue(activityId.startsWith("ACT-"), "Activity ID should start with ACT-");
    }

    @Test
    @Order(8)
    @DisplayName("8. Get Lead Statistics - Should return lead metrics")
    void testGetLeadStatistics() throws Exception {
        mockMvc.perform(get("/api/v1/leads/statistics")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalLeads").exists())
                .andReturn();
    }

    @Test
    @Order(9)
    @DisplayName("9. Get Opportunity Statistics - Should return pipeline metrics")
    void testGetOpportunityStatistics() throws Exception {
        mockMvc.perform(get("/api/v1/opportunities/statistics")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists())
                .andReturn();
    }

    @Test
    @Order(10)
    @DisplayName("10. Get Activities by Opportunity - Should return linked activities")
    void testGetActivitiesByOpportunity() throws Exception {
        mockMvc.perform(get("/api/v1/activities/opportunity/" + opportunityId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();
    }

    @Test
    @Order(11)
    @DisplayName("11. Search Leads - Should find leads by search term")
    void testSearchLeads() throws Exception {
        mockMvc.perform(get("/api/v1/leads/search?searchTerm=John")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();
    }

    @Test
    @Order(12)
    @DisplayName("12. Complete Workflow Verification - All entities created successfully")
    void testCompleteWorkflowVerification() {
        assertNotNull(authToken, "Auth token created");
        assertNotNull(leadId, "Lead created");
        assertNotNull(contactId, "Contact created from lead conversion");
        assertNotNull(accountId, "Account created from lead conversion");
        assertNotNull(opportunityId, "Opportunity created");
        assertNotNull(activityId, "Activity created");

        System.out.println("\n=== CRM Integration Test Summary ===");
        System.out.println("✓ Authentication successful");
        System.out.println("✓ Lead created: " + leadId);
        System.out.println("✓ Lead qualified and converted");
        System.out.println("✓ Contact created: " + contactId);
        System.out.println("✓ Account created: " + accountId);
        System.out.println("✓ Opportunity created: " + opportunityId);
        System.out.println("✓ Activity created: " + activityId);
        System.out.println("✓ Statistics and search working");
        System.out.println("====================================\n");
    }
}
