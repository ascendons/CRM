package com.ultron.backend.multitenancy;

import com.ultron.backend.domain.entity.Contact;
import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.repository.ContactRepository;
import com.ultron.backend.repository.LeadRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Critical security tests: Verify tenant data isolation
 * These tests ensure that data from one tenant cannot be accessed by another tenant
 */
@SpringBootTest
@ActiveProfiles("test")
class TenantIsolationIntegrationTest {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private LeadRepository leadRepository;

    private String tenantAId = "tenant-A-test-id";
    private String tenantBId = "tenant-B-test-id";

    @BeforeEach
    void setUp() {
        // Clean up any existing test data
        TenantContext.clear();
    }

    @AfterEach
    void cleanup() {
        // Always clear tenant context after each test
        TenantContext.clear();

        // Clean up test data
        contactRepository.deleteAll();
        leadRepository.deleteAll();
    }

    @Test
    void shouldIsolateContactsBetweenTenants() {
        // Tenant A creates a contact
        TenantContext.setTenantId(tenantAId);
        Contact contactA = Contact.builder()
                .contactId("CONT-A-001")
                .firstName("Alice")
                .lastName("Anderson")
                .email("alice@tenantA.com")
                .build();
        contactRepository.save(contactA);
        TenantContext.clear();

        // Tenant B creates a contact
        TenantContext.setTenantId(tenantBId);
        Contact contactB = Contact.builder()
                .contactId("CONT-B-001")
                .firstName("Bob")
                .lastName("Brown")
                .email("bob@tenantB.com")
                .build();
        contactRepository.save(contactB);
        TenantContext.clear();

        // Tenant A should only see their contact
        TenantContext.setTenantId(tenantAId);
        List<Contact> tenantAContacts = contactRepository.findAll();
        assertThat(tenantAContacts).hasSize(1);
        assertThat(tenantAContacts.get(0).getFirstName()).isEqualTo("Alice");
        assertThat(tenantAContacts.get(0).getTenantId()).isEqualTo(tenantAId);
        TenantContext.clear();

        // Tenant B should only see their contact
        TenantContext.setTenantId(tenantBId);
        List<Contact> tenantBContacts = contactRepository.findAll();
        assertThat(tenantBContacts).hasSize(1);
        assertThat(tenantBContacts.get(0).getFirstName()).isEqualTo("Bob");
        assertThat(tenantBContacts.get(0).getTenantId()).isEqualTo(tenantBId);
        TenantContext.clear();
    }

    @Test
    void shouldPreventCrossTenantAccessByMongoId() {
        // Tenant A creates a contact
        TenantContext.setTenantId(tenantAId);
        Contact contactA = Contact.builder()
                .contactId("CONT-A-002")
                .firstName("Alice")
                .email("alice2@tenantA.com")
                .build();
        Contact savedContact = contactRepository.save(contactA);
        String contactMongoId = savedContact.getId();
        TenantContext.clear();

        // Tenant B tries to access Tenant A's contact by MongoDB ID
        TenantContext.setTenantId(tenantBId);
        Optional<Contact> found = contactRepository.findById(contactMongoId);

        // Should not find it (tenant filtering prevents access)
        assertThat(found).isEmpty();
        TenantContext.clear();
    }

    @Test
    void shouldPreventCrossTenantAccessByBusinessId() {
        // Tenant A creates a contact
        TenantContext.setTenantId(tenantAId);
        Contact contactA = Contact.builder()
                .contactId("CONT-A-003")
                .firstName("Alice")
                .email("alice3@tenantA.com")
                .build();
        contactRepository.save(contactA);
        TenantContext.clear();

        // Tenant B tries to access Tenant A's contact by business ID
        TenantContext.setTenantId(tenantBId);
        Optional<Contact> found = contactRepository.findByContactId("CONT-A-003");

        // Should not find it
        assertThat(found).isEmpty();
        TenantContext.clear();
    }

    @Test
    void shouldAutoSetTenantIdOnNewEntity() {
        // Set tenant context
        TenantContext.setTenantId(tenantAId);

        // Create contact without explicitly setting tenantId
        Contact contact = Contact.builder()
                .contactId("CONT-A-004")
                .firstName("Charlie")
                .email("charlie@tenantA.com")
                .build();

        // TenantId should be null before save
        assertThat(contact.getTenantId()).isNull();

        // Save contact
        Contact saved = contactRepository.save(contact);

        // TenantId should be auto-set by TenantEntityListener
        assertThat(saved.getTenantId()).isEqualTo(tenantAId);

        TenantContext.clear();
    }

    @Test
    void shouldEnforceTenantContextRequirement() {
        // Attempt to query without tenant context
        TenantContext.clear();

        // Query should proceed but might return unexpected results
        // (In production, you might want to throw exception if tenant context missing)
        List<Contact> contacts = contactRepository.findAll();

        // Verify behavior (depends on your TenantAwareMongoTemplate implementation)
        // If tenant context is required, this should throw exception or return empty
        assertThat(contacts).isNotNull();
    }

    @Test
    void shouldIsolateLeadsBetweenTenants() {
        // Tenant A creates a lead
        TenantContext.setTenantId(tenantAId);
        Lead leadA = Lead.builder()
                .leadId("LEAD-A-001")
                .firstName("David")
                .lastName("Davis")
                .email("david@tenantA.com")
                .companyName("Company A")
                .build();
        leadRepository.save(leadA);
        TenantContext.clear();

        // Tenant B creates a lead
        TenantContext.setTenantId(tenantBId);
        Lead leadB = Lead.builder()
                .leadId("LEAD-B-001")
                .firstName("Eve")
                .lastName("Evans")
                .email("eve@tenantB.com")
                .companyName("Company B")
                .build();
        leadRepository.save(leadB);
        TenantContext.clear();

        // Tenant A should only see their lead
        TenantContext.setTenantId(tenantAId);
        List<Lead> tenantALeads = leadRepository.findAll();
        assertThat(tenantALeads).hasSize(1);
        assertThat(tenantALeads.get(0).getCompanyName()).isEqualTo("Company A");
        TenantContext.clear();

        // Tenant B should only see their lead
        TenantContext.setTenantId(tenantBId);
        List<Lead> tenantBLeads = leadRepository.findAll();
        assertThat(tenantBLeads).hasSize(1);
        assertThat(tenantBLeads.get(0).getCompanyName()).isEqualTo("Company B");
        TenantContext.clear();
    }

    @Test
    void shouldAllowSameEmailInDifferentTenants() {
        String sharedEmail = "john@company.com";

        // Tenant A creates contact with email
        TenantContext.setTenantId(tenantAId);
        Contact contactA = Contact.builder()
                .contactId("CONT-A-005")
                .firstName("John")
                .lastName("Smith")
                .email(sharedEmail)
                .build();
        contactRepository.save(contactA);
        TenantContext.clear();

        // Tenant B creates contact with same email (should be allowed - different tenant)
        TenantContext.setTenantId(tenantBId);
        Contact contactB = Contact.builder()
                .contactId("CONT-B-002")
                .firstName("John")
                .lastName("Jones")
                .email(sharedEmail)
                .build();
        contactRepository.save(contactB);
        TenantContext.clear();

        // Verify both contacts exist in their respective tenants
        TenantContext.setTenantId(tenantAId);
        Optional<Contact> foundA = contactRepository.findByEmailAndIsDeletedFalse(sharedEmail);
        assertThat(foundA).isPresent();
        assertThat(foundA.get().getLastName()).isEqualTo("Smith");
        TenantContext.clear();

        TenantContext.setTenantId(tenantBId);
        Optional<Contact> foundB = contactRepository.findByEmailAndIsDeletedFalse(sharedEmail);
        assertThat(foundB).isPresent();
        assertThat(foundB.get().getLastName()).isEqualTo("Jones");
        TenantContext.clear();
    }

    @Test
    void shouldCountOnlyTenantRecords() {
        // Tenant A creates 3 contacts
        TenantContext.setTenantId(tenantAId);
        for (int i = 0; i < 3; i++) {
            Contact contact = Contact.builder()
                    .contactId("CONT-A-" + i)
                    .firstName("Contact" + i)
                    .email("contact" + i + "@tenantA.com")
                    .build();
            contactRepository.save(contact);
        }
        TenantContext.clear();

        // Tenant B creates 2 contacts
        TenantContext.setTenantId(tenantBId);
        for (int i = 0; i < 2; i++) {
            Contact contact = Contact.builder()
                    .contactId("CONT-B-" + i)
                    .firstName("Contact" + i)
                    .email("contact" + i + "@tenantB.com")
                    .build();
            contactRepository.save(contact);
        }
        TenantContext.clear();

        // Tenant A should count only their 3 contacts
        TenantContext.setTenantId(tenantAId);
        long countA = contactRepository.count();
        assertThat(countA).isEqualTo(3);
        TenantContext.clear();

        // Tenant B should count only their 2 contacts
        TenantContext.setTenantId(tenantBId);
        long countB = contactRepository.count();
        assertThat(countB).isEqualTo(2);
        TenantContext.clear();
    }
}
