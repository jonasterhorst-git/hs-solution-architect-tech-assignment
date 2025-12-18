// app.js
// Quick React frontend POC for the Breezy HubSpot integration assignment.
// No build step required (loaded via Babel in browser).
const { useState, useEffect } = React;

function App() {
  // contacts & meta
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);

  // create contact form
  const [cFirst, setCFirst] = useState('');
  const [cLast, setCLast] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [creatingContact, setCreatingContact] = useState(false);
  const [contactToast, setContactToast] = useState(null);

  // deals
  const [dealName, setDealName] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [dealStage, setDealStage] = useState('closedwon');
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [dealToast, setDealToast] = useState(null);

  // per-contact deals cache
  const [dealsByContact, setDealsByContact] = useState({});
  const [loadingDealsFor, setLoadingDealsFor] = useState(null);
  const [dealsError, setDealsError] = useState(null);

  // base API root
  const API_ROOT = 'http://localhost:3001/api';

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setLoadingContacts(true);
    setContactsError(null);
    try {
      const res = await fetch(`${API_ROOT}/contacts`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      // backend may return { results: [...] } or an array directly
      const raw = data?.results ?? data ?? [];
      // normalize
      const list = (Array.isArray(raw) ? raw : []).map(normalizeContact);
      setContacts(list);
    } catch (err) {
      console.error('loadContacts error', err);
      setContactsError(err.message || 'Failed to load contacts');
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }

  function normalizeContact(c) {
    // HubSpot contact objects often include properties under .properties
    const props = c.properties ?? c;
    return {
      id: c.id ?? props.id ?? props.vid ?? props.contactId ?? null,
      firstname: props.firstname ?? props.firstName ?? '',
      lastname: props.lastname ?? props.lastName ?? '',
      email: props.email ?? '',
      jobtitle: props.jobtitle ?? props.title ?? '',
      company: props.company ?? '',
      phone: props.phone ?? '',
      address: props.address ?? '',
      raw: c
    };
  }

  async function handleCreateContact(e) {
    e.preventDefault();
    if (!cFirst || !cLast || !cEmail) {
      setContactToast({ type: 'error', text: 'Please provide first name, last name and email.' });
      setTimeout(()=>setContactToast(null),3000);
      return;
    }
    setCreatingContact(true);
    setContactToast(null);
    try {
      const payload = { properties: {
        firstname: cFirst,
        lastname: cLast,
        email: cEmail,
        ...(cPhone ? { phone: cPhone } : {}),
        ...(cAddress ? { address: cAddress } : {})
      }};
      const res = await fetch(`${API_ROOT}/contacts`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text || res.statusText}`);
      }
      setContactToast({ type:'success', text:'Contact created in HubSpot.' });
      // clear form
      setCFirst(''); setCLast(''); setCEmail(''); setCPhone(''); setCAddress('');
      // refresh list
      await loadContacts();
    } catch (err) {
      console.error('create contact err', err);
      setContactToast({ type:'error', text: err.message || 'Failed to create contact' });
    } finally {
      setCreatingContact(false);
      setTimeout(()=>setContactToast(null),3000);
    }
  }

  async function handleCreateDeal(e) {
    e.preventDefault();
    if (!dealName || !dealAmount) {
      setDealToast({ type:'error', text:'Please provide deal name and amount.' });
      setTimeout(()=>setDealToast(null),3000);
      return;
    }
    if (contacts.length === 0) {
      setDealToast({ type:'error', text:'No contacts available. Create a contact first.' });
      setTimeout(()=>setDealToast(null),3000);
      return;
    }
    // pick contactId from selection element
    const sel = document.getElementById('deal-contact-select');
    const contactId = sel?.value;
    if (!contactId) {
      setDealToast({ type:'error', text:'Select a contact for the deal.' });
      setTimeout(()=>setDealToast(null),3000);
      return;
    }

    setCreatingDeal(true);
    try {
      const payload = {
        dealProperties: {
          dealname: dealName,
          amount: String(dealAmount),
          dealstage: dealStage
        },
        contactId: contactId
      };
      const res = await fetch(`${API_ROOT}/deals`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text || res.statusText}`);
      }
      setDealToast({ type:'success', text:'Deal created and associated to contact.' });
      // refresh deals for the selected contact if already loaded
      await loadDealsForContact(contactId);
      // clear
      setDealName(''); setDealAmount('');
    } catch (err) {
      console.error('create deal error', err);
      setDealToast({ type:'error', text: err.message || 'Failed to create deal' });
    } finally {
      setCreatingDeal(false);
      setTimeout(()=>setDealToast(null),3000);
    }
  }

  async function loadDealsForContact(contactId) {
    if (!contactId) return;
    setLoadingDealsFor(contactId);
    setDealsError(null);
    try {
      const res = await fetch(`${API_ROOT}/contacts/${contactId}/deals`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      const raw = data?.results ?? data ?? [];
      // normalize deals
      const list = (Array.isArray(raw) ? raw : []).map(d => ({
        id: d.id ?? d.dealId ?? d.objectId ?? null,
        name: d.properties?.dealname ?? d.dealname ?? d.name ?? '',
        amount: d.properties?.amount ?? d.amount ?? d.dealAmount ?? '',
        stage: d.properties?.dealstage ?? d.dealstage ?? d.stage ?? ''
      }));
      setDealsByContact(prev => ({ ...prev, [contactId]: list }));
    } catch (err) {
      console.error('load deals error', err);
      setDealsError(err.message || 'Failed to load deals');
      setDealsByContact(prev => ({ ...prev, [contactId]: [] }));
    } finally {
      setLoadingDealsFor(null);
    }
  }

  // helper to display property or placeholder
  const showOrDash = (v) => v ? v : <span style={{color:'#9aa6b2'}}>&mdash;</span>;

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <div className="logo">B</div>
          <div>
            <div className="title">Breezy — HubSpot Integration POC</div>
            <div className="subtitle">Simulate sync of customers & subscriptions into HubSpot</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:13, color:'#5b6b78', fontWeight:700}}>Status</div>
          <div style={{marginTop:6}}>
            {loadingContacts ? (
              <span className="status status-none">Loading contacts…</span>
            ) : contactsError ? (
              <span className="status status-none">Contacts error</span>
            ) : (
              <span className="status status-ok">{contacts.length} contacts in HubSpot</span>
            )}
          </div>
        </div>
      </div>

      {/* Left column: Contacts & table */}
      <div>
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{margin:0}}>HubSpot Contacts</h3>
            <div style={{display:'flex', gap:8}}>
              <button className="btn btn-primary btn-sm" onClick={loadContacts} disabled={loadingContacts}>
                {loadingContacts ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {contactsError && <div className="toast error" style={{marginTop:12}}>Error: {contactsError}</div>}

          <div style={{marginTop:12}}>
            <table className="table">
              <thead>
                <tr>
                  <th>First</th>
                  <th>Last</th>
                  <th>Email</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th style={{width:160}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingContacts ? (
                  <tr><td colSpan="6" style={{padding:20}}>Loading contacts…</td></tr>
                ) : contacts.length === 0 ? (
                  <tr><td colSpan="6" className="empty">No contacts found. Create one using the form on the right.</td></tr>
                ) : contacts.map(c => (
                  <tr key={c.id || `${c.email}-${c.firstname}`}>
                    <td>{showOrDash(c.firstname)}</td>
                    <td>{showOrDash(c.lastname)}</td>
                    <td>{showOrDash(c.email)}</td>
                    <td>{showOrDash(c.jobtitle)}</td>
                    <td>{showOrDash(c.company)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => {
                          // select contact in the create-deal select for convenience
                          const sel = document.getElementById('deal-contact-select');
                          if (sel) sel.value = c.id;
                          loadDealsForContact(c.id);
                        }}>
                          View Deals
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deals preview for the selected contact (if any loaded) */}
        <div className="card" style={{marginTop:16}}>
          <h4 style={{marginTop:0}}>Contact Deals</h4>
          {dealsError && <div className="toast error">Deals error: {dealsError}</div>}
          <div style={{marginTop:10}}>
            <small style={{color:'#6b7280'}}>Load a contact's deals by pressing "View Deals" in the table or by creating a deal for a contact.</small>
            {Object.keys(dealsByContact).length === 0 ? (
              <div className="empty" style={{marginTop:12}}>No deals loaded yet.</div>
            ) : (
              Object.entries(dealsByContact).map(([contactId, deals]) => (
                <div key={contactId} style={{marginTop:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontWeight:700}}>Contact ID: {contactId}</div>
                    <div style={{fontSize:13, color:'#6b7280'}}>{loadingDealsFor === contactId ? 'Loading…' : `${deals.length} deals`}</div>
                  </div>

                  {deals.length === 0 ? (
                    <div className="empty">No deals found for this contact.</div>
                  ) : deals.map(d => (
                    <div key={d.id || d.name} className="deal">
                      <div>
                        <div style={{fontWeight:700}}>{d.name}</div>
                        <div className="meta">Amount: {d.amount || '—'} • Stage: {d.stage || '—'}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13, color:'#6b7280'}}>Deal ID</div>
                        <div style={{fontWeight:700}}>{d.id || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right column: forms & controls */}
      <aside className="side">
        <div className="card">
          <h4 style={{marginTop:0}}>Create Contact (Simulate Purchase)</h4>
          <form onSubmit={handleCreateContact}>
            <div className="form-row">
              <div className="field">
                <label className="label">First name</label>
                <input className="input" value={cFirst} onChange={e=>setCFirst(e.target.value)} placeholder="Alex" />
              </div>
              <div className="field">
                <label className="label">Last name</label>
                <input className="input" value={cLast} onChange={e=>setCLast(e.target.value)} placeholder="Rivera" />
              </div>
            </div>

            <div className="form-row">
              <div className="field" style={{flex:1}}>
                <label className="label">Email</label>
                <input className="input" value={cEmail} onChange={e=>setCEmail(e.target.value)} placeholder="alex@example.com" />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label">Phone (optional)</label>
                <input className="input" value={cPhone} onChange={e=>setCPhone(e.target.value)} placeholder="555-0123" />
              </div>
              <div className="field">
                <label className="label">Address (optional)</label>
                <input className="input" value={cAddress} onChange={e=>setCAddress(e.target.value)} placeholder="123 Main St" />
              </div>
            </div>

            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button className="btn btn-primary" type="submit" disabled={creatingContact}>
                {creatingContact ? 'Creating…' : 'Create & Sync to HubSpot'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => {
                setCFirst(''); setCLast(''); setCEmail(''); setCPhone(''); setCAddress('');
              }}>Clear</button>
            </div>
          </form>

          {contactToast && (
            <div className={`toast ${contactToast.type === 'success' ? 'success' : 'error'}`} style={{marginTop:12}}>
              {contactToast.text}
            </div>
          )}
        </div>

        <div className="card">
          <h4 style={{marginTop:0}}>Create Deal (Subscription Conversion)</h4>
          <form onSubmit={handleCreateDeal}>
            <div className="form-row">
              <div className="field">
                <label className="label">Deal name</label>
                <input className="input" value={dealName} onChange={e=>setDealName(e.target.value)} placeholder="Breezy Premium - Annual" />
              </div>
            </div>

            <div className="form-row">
              <div className="field" style={{flex:1}}>
                <label className="label">Amount (USD)</label>
                <input className="input" value={dealAmount} onChange={e=>setDealAmount(e.target.value)} placeholder="99" />
              </div>
              <div className="field" style={{flex:1}}>
                <label className="label">Stage</label>
                <select className="select" value={dealStage} onChange={e=>setDealStage(e.target.value)}>
                  <option value="closedwon">closedwon</option>
                  <option value="closedlost">closedlost</option>
                  <option value="appointmentscheduled">appointment</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label">Associate contact</label>
                <select id="deal-contact-select" className="select">
                  <option value="">-- select contact --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.firstname} {c.lastname} — {c.email}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button className="btn btn-primary" type="submit" disabled={creatingDeal}>
                {creatingDeal ? 'Creating…' : 'Create Deal in HubSpot'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setDealName(''); setDealAmount(''); }}>
                Clear
              </button>
            </div>
          </form>

          {dealToast && (
            <div className={`toast ${dealToast.type === 'success' ? 'success' : 'error'}`} style={{marginTop:12}}>
              {dealToast.text}
            </div>
          )}

          <div style={{marginTop:12, fontSize:13, color:'#6b7280'}}>
            Tip: after creating a deal, use <strong>View Deals</strong> for that contact to refresh the deals view.
          </div>
        </div>

        <div className="card">
          <h4 style={{marginTop:0}}>Quick AI-ish Insight</h4>
          <p style={{marginTop:6, color:'#6b7280', fontSize:13}}>
            Small local rule engine that flags contacts who might be expansion opportunities (own &gt;=2 thermostats).
            This is a simple demonstration of "AI-ish" insight without external API keys.
          </p>

          <InsightPanel contacts={contacts} />
        </div>
      </aside>
    </div>
  );
}

/**
 * Small rule-based "insight" panel — demonstrates the optional AI feature without calling external APIs.
 * Checks contacts' raw object for a hypothetical "thermostat_count" property, otherwise simulates via email domain heuristics.
 */
function InsightPanel({contacts}) {
  // Build lightweight insights
  const expansionCandidates = contacts.filter(c => {
    // If the backend included a thermostat_count property on contact.properties, use it:
    const thermostatCount = c.raw?.properties?.thermostat_count ?? c.raw?.thermostat_count;
    if (thermostatCount && Number(thermostatCount) >= 2) return true;
    // fallback heuristic: customers with multiple emails from same domain or company name suggest multi-device households
    if (c.company && c.company.toLowerCase().includes('home')) return true;
    // random small heuristic: if email contains plus-addressing (john+1@) treat as power-user (not reliable)
    if (c.email && c.email.includes('+')) return true;
    return false;
  });

  return (
    <div style={{marginTop:8}}>
      {contacts.length === 0 ? (
        <div className="empty">No contacts to analyze yet.</div>
      ) : (
        <>
          <div style={{fontWeight:700}}>{expansionCandidates.length} potential expansion candidates</div>
          <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:8}}>
            {expansionCandidates.slice(0,5).map(c => (
              <div key={c.id || c.email} className="deal">
                <div>
                  <div style={{fontWeight:700}}>{c.firstname} {c.lastname}</div>
                  <div className="meta">{c.email} • {c.company || '—'}</div>
                </div>
                <div style={{textAlign:'right', color:'#6b7280'}}>Flag</div>
              </div>
            ))}
            {expansionCandidates.length === 0 && <div className="empty">No likely expansion candidates detected by heuristics.</div>}
          </div>
        </>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);